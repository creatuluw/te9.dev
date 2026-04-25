<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
    import {
        architectureData,
        type ArchitectureNode,
    } from "$lib/config/architecture-data";
    import type { HierarchyNode, HierarchyPointLink } from "d3";

    let svgContainer: HTMLDivElement;
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

    // Color scheme for different node types
    const typeColors = {
        route: "#3b82f6", // blue - main routes
        component: "#10b981", // emerald - UI components
        service: "#f59e0b", // amber - services
        api: "#8b5cf6", // purple - API endpoints
        store: "#ef4444", // red - state stores
        database: "#6b7280", // gray - databases
    };

    onMount(() => {
        createIndentedTree();

        // Handle window resize
        window.addEventListener("resize", () => {
            createIndentedTree();
        });
    });

    function createIndentedTree() {
        if (!svgContainer) return;

        // Clear existing SVG
        d3.select(svgContainer).selectAll("*").remove();

        const containerWidth = svgContainer.clientWidth;
        const containerHeight = Math.max(svgContainer.clientHeight, 1200);

        // Create SVG
        svg = d3
            .select(svgContainer)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        // Create hierarchy from data
        const root = d3.hierarchy(architectureData);

        // Sort children by name
        root.sort((a, b) => d3.ascending(a.data.name, b.data.name));

        // Calculate layout
        const dx = 20; // height of each node (20px spacing)
        const dy = 350; // width per level (depth)
        const margin = { top: 20, right: 120, bottom: 20, left: 150 };

        // Compute the height of the tree
        let i = 0;
        root.eachBefore((d) => {
            d.x = ++i * dx;
        });

        // Create the tree layout
        const treeLayout = d3
            .tree<ArchitectureNode>()
            .nodeSize([dx, dy])
            .separation((a, b) => {
                // 20px spacing between all nodes
                return 1;
            }) as any;

        treeLayout(root);

        // Collapse all nodes at depth 2 and deeper by default BEFORE calculating bounds
        function collapse(d: any) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }
        root.children?.forEach(collapse);

        // Calculate visible tree bounds AFTER collapsing for proper initial zoom
        treeLayout(root);
        const visibleBounds = {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity,
        };
        root.each((d) => {
            if (d.x! < visibleBounds.minX) visibleBounds.minX = d.x!;
            if (d.x! > visibleBounds.maxX) visibleBounds.maxX = d.x!;
            if (d.y! < visibleBounds.minY) visibleBounds.minY = d.y!;
            if (d.y! > visibleBounds.maxY) visibleBounds.maxY = d.y!;
        });

        // Create main group with margin
        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Store initial collapsed state
        let activeNode: HierarchyNode<ArchitectureNode> | null = null;

        // Draw links (curved lines)
        const link = g
            .selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr(
                "d",
                d3
                    .linkHorizontal<any, any>()
                    .x((d) => d.y)
                    .y((d) => d.x),
            )
            .attr("fill", "none")
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", 1.5);

        // Draw nodes
        const node = g
            .selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.y},${d.x})`);

        // Add colored circles for nodes
        node.append("circle")
            .attr("r", 6)
            .attr("fill", (d) => {
                // Use the parent's type for root or get the node's type
                const type = d.data.type || d.parent?.data.type || "route";
                return typeColors[type as keyof typeof typeColors] || "#9ca3af";
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

        // Add click handler to toggle expand/collapse
        node.on("click", (event: MouseEvent, d: any) => {
            if (d.children || d._children) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            }
        });

        // Add labels with background
        node.append("text")
            .attr("dy", ".35em")
            .attr("x", (d) => (d.children ? -12 : 12))
            .style("text-anchor", (d) => (d.children ? "end" : "start"))
            .style("font-size", "13px")
            .style("font-family", "system-ui, -apple-system, sans-serif")
            .style("fill", "#374151")
            .style("cursor", "pointer")
            .text((d) => {
                return d.data.name;
            });

        // Add description tooltip on hover
        node.append("title").text((d) => {
            let tooltip = d.data.name;
            if (d.data.description) {
                tooltip += `\n\n${d.data.description}`;
            }
            if (d.data.path) {
                tooltip += `\n\nPath: ${d.data.path}`;
            }
            return tooltip;
        });

        // Zoom and pan functionality
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Initial fit to content - use visible tree bounds for proper initial sizing
        const visibleTreeHeight = visibleBounds.maxX - visibleBounds.minX + 50; // Add padding (vertical: minX to maxX)
        const visibleTreeWidth = visibleBounds.maxY - visibleBounds.minY + 50; // Add padding (horizontal: minY to maxY)
        const fullWidth = containerWidth - margin.left - margin.right;
        const fullHeight = containerHeight - margin.top - margin.bottom;
        const scale = Math.min(
            fullWidth / visibleTreeWidth,
            fullHeight / visibleTreeHeight,
            0.8,
        );
        // Left align with 50px margin, position root in upper third so tree extends downward and appears centered
        const translateX = margin.left + 50 - visibleBounds.minY * scale;
        const translateY = containerHeight / 3 - root.x! * scale;

        svg.call(
            zoom.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale),
        );

        function update(source: HierarchyNode<ArchitectureNode>) {
            // Recompute the new tree layout
            const newRoot = treeLayout(root);

            // Get the new nodes and links
            const nodes = newRoot.descendants();
            const links = newRoot.links();

            // Normalize for fixed-depth
            nodes.forEach((d: any) => {
                d.y = d.depth * dy;
            });

            // Update the nodes
            const node = g.selectAll(".node").data(nodes, (d: any) => {
                if (!d.id) d.id = ++i;
                return d.id;
            });

            // Enter any new nodes at the parent's previous position
            const nodeEnter = node
                .enter()
                .append("g")
                .attr("class", "node")
                .attr(
                    "transform",
                    () =>
                        `translate(${(source as any).y0},${(source as any).x0})`,
                )
                .on("click", (event: MouseEvent, d: any) => {
                    if (d.children || d._children) {
                        if (d.children) {
                            d._children = d.children;
                            d.children = null;
                        } else {
                            d.children = d._children;
                            d._children = null;
                        }
                        update(d);
                    }
                });

            nodeEnter
                .append("circle")
                .attr("r", 1e-6)
                .style("fill", (d: any) => {
                    const type = d.data.type || d.parent?.data.type || "route";
                    return d._children
                        ? typeColors[type as keyof typeof typeColors]
                        : "#fff";
                })
                .style("stroke", (d: any) => {
                    const type = d.data.type || d.parent?.data.type || "route";
                    return typeColors[type as keyof typeof typeColors];
                })
                .style("stroke-width", "2px");

            nodeEnter
                .append("text")
                .attr("dy", ".35em")
                .attr("x", (d: any) => (d.children || d._children ? -10 : 10))
                .attr("text-anchor", (d: any) =>
                    d.children || d._children ? "end" : "start",
                )
                .text((d: any) => d.data.name)
                .style("fill-opacity", 1e-6)
                .style("font-size", "13px")
                .style("font-family", "system-ui, -apple-system, sans-serif")
                .style("cursor", "pointer");

            // Transition nodes to their new position
            const nodeUpdate: any = (node as any)
                .merge(nodeEnter)
                .transition()
                .duration(750);

            nodeUpdate.attr(
                "transform",
                (d: any) => `translate(${d.y},${d.x})`,
            );

            nodeUpdate
                .select("circle")
                .attr("r", 6)
                .style("fill", (d: any) => {
                    const type = d.data.type || d.parent?.data.type || "route";
                    return d._children
                        ? typeColors[type as keyof typeof typeColors]
                        : "#fff";
                })
                .style("stroke", (d: any) => {
                    const type = d.data.type || d.parent?.data.type || "route";
                    return typeColors[type as keyof typeof typeColors];
                });

            nodeUpdate.select("text").style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position
            const nodeExit = node.exit().transition().duration(750).remove();

            nodeExit.attr(
                "transform",
                (d: any) => `translate(${source.y},${source.x})`,
            );

            nodeExit.select("circle").attr("r", 1e-6);

            nodeExit.select("text").style("fill-opacity", 1e-6);

            // Update the links
            const link = g
                .selectAll(".link")
                .data(links, (d: any) => d.target.id);

            // Enter any new links at the parent's previous position
            const linkEnter = link
                .enter()
                .insert("path", "g")
                .attr("class", "link")
                .attr("d", (d) => {
                    const o = { x: (source as any).x0, y: (source as any).y0 };
                    return d3
                        .linkHorizontal<any, any>()
                        .x((d) => d.y)
                        .y((d) => d.x)({ source: o, target: o } as any);
                })
                .attr("fill", "none")
                .attr("stroke", "#e5e7eb")
                .attr("stroke-width", 1.5);

            // Transition links to their new position
            const linkUpdate: any = (link as any)
                .merge(linkEnter)
                .transition()
                .duration(750);

            linkUpdate.attr(
                "d",
                d3
                    .linkHorizontal<any, any>()
                    .x((d) => d.y)
                    .y((d) => d.x),
            );

            // Transition exiting nodes to the parent's new position
            link.exit()
                .transition()
                .duration(750)
                .remove()
                .attr("d", (d: any) => {
                    const o = { x: source.x, y: source.y };
                    return d3
                        .linkHorizontal<any, any>()
                        .x((d) => d.y)
                        .y((d) => d.x)({ source: o, target: o } as any);
                });

            // Stash the old positions for transition
            nodes.forEach((d: any) => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }
    }
</script>

<svelte:head>
    <title>Application Architecture - Kees</title>
    <meta
        name="description"
        content="Interactive architecture diagram of the Kees application"
    />
</svelte:head>

<div class="min-h-screen bg-gray-50 p-8 w-full">
    <div>
        <!-- Legend -->
        <div
            class="mb-6 flex flex-wrap gap-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200"
        >
            <h3 class="text-sm font-semibold text-gray-700 mr-2">Legend:</h3>
            {#each Object.entries(typeColors) as [type, color] (type)}
                <div class="flex items-center gap-2">
                    <div
                        class="w-4 h-4 rounded-full"
                        style="background-color: {color}"
                    ></div>
                    <span class="text-sm text-gray-600 capitalize">{type}</span>
                </div>
            {/each}
        </div>

        <!-- Tree Diagram Container -->
        <div
            class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
        >
            <div class="p-4 bg-gray-50 border-b border-gray-200">
                <p class="text-sm text-gray-600">
                    💡 <strong>Tip:</strong> Click on nodes to expand/collapse. Use
                    scroll to zoom and drag to pan.
                </p>
            </div>
            <div
                bind:this={svgContainer}
                class="w-full"
                style="height: 600px;"
            ></div>
        </div>
    </div>
</div>

<style>
    :global(.node circle) {
        cursor: pointer;
        transition: all 0.2s ease;
    }

    :global(.node circle:hover) {
        r: 8;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    :global(.node text) {
        user-select: none;
    }

    :global(.node text:hover) {
        fill: #000 !important;
    }

    :global(.link) {
        transition: all 0.2s ease;
    }
</style>
