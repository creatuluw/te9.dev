<script lang="ts">
	import {
		getBezierPath,
		BaseEdge,
		type EdgeProps,
		useEdges,
		EdgeLabel
	} from '@xyflow/svelte';

	let {
		id,
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		markerEnd,
		style
	}: EdgeProps = $props();

	let [edgePath, labelX, labelY] = $derived(
		getBezierPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition
		})
	);

	const edges = useEdges();

	const onEdgeClick = () => edges.update((eds) => eds.filter((edge) => edge.id !== id));
</script>

<BaseEdge path={edgePath} {markerEnd} {style} />
<EdgeLabel x={labelX} y={labelY} class="button-edge__label">
	<button class="button-edge__button" onclick={onEdgeClick}>×</button>
</EdgeLabel>

<style>
	:global(.button-edge__label) {
		position: absolute;
		pointer-events: all;
		transform-origin: center;
		background: transparent;
	}

	:global(.button-edge__button) {
		width: 30px;
		height: 30px;
		border: 5px solid white;
		color: rgb(24 24 27); /* text-zinc-900 */
		background-color: rgb(244 244 245); /* bg-zinc-100 */
		cursor: pointer;
		border-radius: 50%;
		font-size: 12px;
		padding-top: 0px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s, color 0.2s;
	}

	:global(.button-edge__button:hover) {
		background-color: rgb(113 113 122); /* bg-zinc-500 */
		color: white;
	}
</style>

