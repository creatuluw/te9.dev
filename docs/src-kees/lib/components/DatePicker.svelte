<script lang="ts">
    import { onMount, mount, unmount } from "svelte";

    // Portal action: moves the element to document.body so it escapes
    // ancestor CSS transforms (e.g. Drawer transitions) that break position:fixed
    function portal(node: HTMLElement) {
        const target = document.body;
        target.appendChild(node);
        return {
            destroy() {
                if (node.parentNode === target) {
                    target.removeChild(node);
                }
            },
        };
    }

    /**
     * DatePicker component props
     *
     * Date picker component with calendar dropdown. Supports min/max dates and custom styling.
     */
    interface Props {
        /**
         * Selected date value in YYYY-MM-DD format
         * @default null
         * @example
         * ```typescript
         * <DatePicker bind:value={selectedDate} />
         * ```
         */
        value?: string | null;

        /**
         * Placeholder text
         * @default 'Select date'
         */
        placeholder?: string;

        /**
         * Disable the date picker
         * @default false
         */
        disabled?: boolean;

        /**
         * Minimum selectable date in YYYY-MM-DD format
         */
        min?: string;

        /**
         * Maximum selectable date in YYYY-MM-DD format
         */
        max?: string;

        /**
         * Input size variant
         * @default 'sm'
         */
        size?: "sm" | "md" | "lg";

        /**
         * Additional CSS classes
         */
        class?: string;

        /**
         * HTML input id attribute
         */
        id?: string;

        /**
         * HTML input name attribute
         */
        name?: string;

        /**
         * Make field required
         * @default false
         */
        required?: boolean;

        /**
         * Change event handler
         * @param value - Selected date in YYYY-MM-DD format (null if cleared)
         * @example
         * ```typescript
         * <DatePicker onchange={(date) => console.log('Date:', date)} />
         * ```
         */
        onchange?: (value: string | null) => void;

        /**
         * Input event handler (fires on every keystroke)
         * @param event - Native input event
         */
        oninput?: (event: Event) => void;

        /**
         * Whether the calendar is open (bindable, for parent container z-index management)
         */
        open?: boolean;
    }

    let calendarPosition = $state({ top: 0, left: 0 });

    let {
        value: dateValue = $bindable<string | null>(null),
        placeholder = "Select date",
        disabled = false,
        min,
        max,
        size = "sm",
        class: className = "",
        id,
        name,
        required = false,
        onchange,
        oninput,
        open: isOpenProp = $bindable(false),
    }: Props = $props();

    let showCalendar = $state(false);

    // Sync internal state with prop
    $effect(() => {
        showCalendar = isOpenProp;
    });

    // Update prop when internal state changes
    $effect(() => {
        isOpenProp = showCalendar;
    });

    // Reposition calendar when it opens and after it renders
    $effect(() => {
        if (showCalendar && calendarElement) {
            // Small delay to ensure calendar is rendered
            requestAnimationFrame(() => {
                updateCalendarPosition();
            });
        }
    });

    let showYearDropdown = $state(false);
    let inputElement: HTMLInputElement;
    let calendarElement = $state<HTMLDivElement | undefined>(undefined);
    let yearDropdownElement = $state<HTMLDivElement | undefined>(undefined);
    let currentMonth = $state(new Date());
    // Get today's date - recalculate to ensure it's always current
    const today = $derived.by(() => {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        return todayDate;
    });

    // Format date to YYYY-MM-DD
    function formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // Parse YYYY-MM-DD to Date
    function parseDate(dateString: string | null): Date | null {
        if (!dateString) return null;
        const date = new Date(dateString + "T00:00:00");
        return isNaN(date.getTime()) ? null : date;
    }

    // Initialize current month from selected date
    const selectedDate = $derived(parseDate(dateValue));
    $effect(() => {
        if (selectedDate) {
            currentMonth = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                1,
            );
        }
    });

    // Get calendar days for current month
    const calendarDays = $derived.by(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // First day of month
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        // Get Monday of the week containing the first day
        const dayOfWeek = firstDay.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
        startDate.setDate(firstDay.getDate() - daysToSubtract);

        const days: Array<{
            date: Date;
            isCurrentMonth: boolean;
            isToday: boolean;
            isSelected: boolean;
            dateString: string;
            isDisabled: boolean;
        }> = [];

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dateString = formatDate(date);
            const isCurrentMonth = date.getMonth() === month;
            const isToday = formatDate(date) === formatDate(today);
            const isSelected = !!(
                selectedDate && formatDate(date) === formatDate(selectedDate)
            );

            // Check if date is within min/max range
            let isDisabled = false;
            if (min) {
                const minDate = parseDate(min);
                if (minDate && date < minDate) isDisabled = true;
            }
            if (max) {
                const maxDate = parseDate(max);
                if (maxDate && date > maxDate) isDisabled = true;
            }

            days.push({
                date,
                isCurrentMonth,
                isToday,
                isSelected,
                dateString,
                isDisabled,
            });
        }

        return days;
    });

    const monthYearLabel = $derived.by(() => {
        const options: Intl.DateTimeFormatOptions = {
            month: "long",
            year: "numeric",
        };
        return currentMonth.toLocaleDateString("en-US", options);
    });

    const monthLabel = $derived.by(() => {
        const options: Intl.DateTimeFormatOptions = { month: "long" };
        return currentMonth.toLocaleDateString("en-US", options);
    });

    const currentYear = $derived(currentMonth.getFullYear());

    // Generate year options (100 years range: 50 years back, 50 years forward from current year)
    const yearOptions = $derived.by(() => {
        const years: number[] = [];
        const startYear = today.getFullYear() - 50;
        const endYear = today.getFullYear() + 50;
        for (let year = startYear; year <= endYear; year++) {
            years.push(year);
        }
        return years;
    });

    const dayHeaders = ["M", "T", "W", "T", "F", "S", "S"];

    function previousMonth() {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        currentMonth = newMonth;
        showYearDropdown = false;
    }

    function nextMonth() {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        currentMonth = newMonth;
        showYearDropdown = false;
    }

    function selectYear(year: number) {
        const newMonth = new Date(currentMonth);
        newMonth.setFullYear(year);
        currentMonth = newMonth;
        showYearDropdown = false;
    }

    function toggleYearDropdown() {
        showYearDropdown = !showYearDropdown;
    }

    function selectDate(dateString: string, isDisabled: boolean) {
        if (isDisabled || disabled) return;
        dateValue = dateString;
        showCalendar = false;
        if (onchange) {
            onchange(dateString);
        }
        if (inputElement && oninput) {
            const event = new Event("input", { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    }

    function updateCalendarPosition() {
        if (inputElement) {
            const rect = inputElement.getBoundingClientRect();
            const calendarWidthPx =
                size === "sm" ? 256 : size === "md" ? 288 : 320;
            const viewportWidth = window.innerWidth;
            const gap = 4;

            let left = rect.left;

            // Adjust horizontal position if would overflow viewport
            const rightEdge = left + calendarWidthPx;
            if (rightEdge > viewportWidth - 16) {
                left = viewportWidth - calendarWidthPx - 16;
            }
            if (left < 16) {
                left = 16;
            }

            // Get calendar height if already rendered, otherwise estimate
            const calendarHeight = calendarElement?.offsetHeight || 280;

            // Position with bottom edge just above the input
            const top = rect.top - calendarHeight - gap;

            calendarPosition = { top: Math.max(16, top), left };
        }
    }

    function handleInputFocus() {
        if (!disabled) {
            // If no date is selected, reset to today's month so today is visible and highlighted
            if (!selectedDate) {
                const todayMonth = new Date();
                todayMonth.setHours(0, 0, 0, 0);
                currentMonth = new Date(
                    todayMonth.getFullYear(),
                    todayMonth.getMonth(),
                    1,
                );
            }
            updateCalendarPosition();
            showCalendar = true;
        }
    }

    function handleInputChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = target.value || null;
        if (value !== dateValue) {
            dateValue = value;
            if (onchange) {
                onchange(value);
            }
        }
        if (oninput) {
            oninput(event);
        }
    }

    // Click outside to close
    onMount(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            // Close calendar if clicking outside
            if (
                calendarElement !== undefined &&
                calendarElement &&
                !calendarElement.contains(target) &&
                inputElement &&
                !inputElement.contains(target)
            ) {
                showCalendar = false;
            }

            // Close year dropdown if clicking outside
            if (
                yearDropdownElement !== undefined &&
                yearDropdownElement &&
                !yearDropdownElement.contains(target) &&
                calendarElement !== undefined &&
                calendarElement &&
                !calendarElement.contains(target)
            ) {
                showYearDropdown = false;
            }
        }

        if (typeof window !== "undefined") {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    });

    // Display value for input
    const displayValue = $derived.by(() => {
        if (!dateValue) return "";
        if (
            typeof dateValue === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
        ) {
            return dateValue;
        }
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return "";
            return formatDate(date);
        } catch {
            return "";
        }
    });

    // Size-based classes for calendar
    const calendarWidth = $derived.by(() => {
        switch (size) {
            case "sm":
                return "w-64";
            case "md":
                return "w-72";
            case "lg":
                return "w-80";
        }
    });

    const calendarPadding = $derived.by(() => {
        switch (size) {
            case "sm":
                return "px-3 py-2";
            case "md":
                return "px-4 py-3";
            case "lg":
                return "px-5 py-4";
        }
    });

    const monthHeaderTextSize = $derived.by(() => {
        switch (size) {
            case "sm":
                return "text-xs";
            case "md":
                return "text-sm";
            case "lg":
                return "text-base";
        }
    });

    const dayHeaderPadding = $derived.by(() => {
        switch (size) {
            case "sm":
                return "px-3 py-1.5";
            case "md":
                return "px-4 py-2";
            case "lg":
                return "px-5 py-2.5";
        }
    });

    const dayHeaderTextSize = $derived.by(() => {
        switch (size) {
            case "sm":
                return "text-[10px]";
            case "md":
                return "text-xs";
            case "lg":
                return "text-xs";
        }
    });

    const calendarTextSize = $derived.by(() => {
        switch (size) {
            case "sm":
                return "text-xs";
            case "md":
                return "text-sm";
            case "lg":
                return "text-base";
        }
    });

    const dayCellPadding = $derived.by(() => {
        switch (size) {
            case "sm":
                return "py-1";
            case "md":
                return "py-1.5";
            case "lg":
                return "py-2";
        }
    });

    const dayCellSize = $derived.by(() => {
        switch (size) {
            case "sm":
                return "size-6";
            case "md":
                return "size-7";
            case "lg":
                return "size-8";
        }
    });
</script>

<div class="relative {className}">
    <!-- Input Field -->
    <div class="relative">
        <div
            class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none"
        >
            <svg
                class="w-4 h-4 text-zinc-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"
                />
            </svg>
        </div>
        {#if dateValue && !disabled}
            <button
                type="button"
                onclick={(e) => {
                    e.stopPropagation();
                    dateValue = null;
                    if (onchange) {
                        onchange(null);
                    }
                    showCalendar = false;
                }}
                class="absolute inset-y-0 end-0 flex items-center pe-3 text-zinc-400 hover:text-zinc-600 transition-colors z-10"
                aria-label="Clear date"
            >
                <svg
                    class="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                    />
                </svg>
            </button>
        {/if}
        <input
            bind:this={inputElement}
            type="date"
            readonly
            {id}
            {name}
            value={displayValue || ""}
            onchange={handleInputChange}
            onfocus={handleInputFocus}
            {min}
            {max}
            {placeholder}
            {disabled}
            {required}
            class="w-full py-2 {dateValue
                ? 'pr-10'
                : 'pr-3'} pl-10 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm cursor-pointer"
        />
    </div>

    <!-- Calendar Dropdown (Portaled to body to escape ancestor transforms that break position:fixed) -->
    {#if showCalendar && !disabled}
        <div
            bind:this={calendarElement}
            use:portal
            style="position: fixed; top: {calendarPosition.top}px; left: {calendarPosition.left}px; z-index: 9999;"
            class="{calendarWidth} rounded-lg bg-white shadow-lg ring-1 ring-zinc-200"
        >
            <!-- Month Navigation -->
            <div
                class="flex items-center justify-between border-b border-zinc-200 {calendarPadding}"
            >
                <button
                    type="button"
                    onclick={previousMonth}
                    class="-m-1.5 flex flex-none items-center justify-center p-1.5 text-zinc-400 hover:text-zinc-500"
                >
                    <span class="sr-only">Previous month</span>
                    <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                        class="size-5"
                    >
                        <path
                            d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                            clip-rule="evenodd"
                            fill-rule="evenodd"
                        />
                    </svg>
                </button>
                <div
                    class="relative flex-auto flex items-center justify-center gap-1"
                >
                    <span
                        class="{monthHeaderTextSize} font-semibold text-zinc-900 font-aspekta"
                        >{monthLabel}</span
                    >
                    <button
                        type="button"
                        onclick={toggleYearDropdown}
                        class="{monthHeaderTextSize} font-semibold text-zinc-900 font-aspekta hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1 rounded px-1 -mx-1 transition-colors"
                    >
                        {currentYear}
                    </button>
                    {#if showYearDropdown}
                        <div
                            bind:this={yearDropdownElement}
                            class="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 bg-white border border-zinc-300 rounded-lg shadow-lg max-h-60 overflow-auto min-w-[80px]"
                        >
                            {#each yearOptions as year (year)}
                                <button
                                    type="button"
                                    onclick={() => selectYear(year)}
                                    class="w-full px-3 py-1.5 text-sm text-left hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none {year ===
                                    currentYear
                                        ? 'bg-zinc-100 font-semibold'
                                        : 'font-normal'} text-zinc-900"
                                >
                                    {year}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
                <button
                    type="button"
                    onclick={nextMonth}
                    class="-m-1.5 flex flex-none items-center justify-center p-1.5 text-zinc-400 hover:text-zinc-500"
                >
                    <span class="sr-only">Next month</span>
                    <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                        class="size-5"
                    >
                        <path
                            d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                            clip-rule="evenodd"
                            fill-rule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            <!-- Day Headers -->
            <div
                class="grid grid-cols-7 border-b border-zinc-200 {dayHeaderPadding} {dayHeaderTextSize} text-zinc-500 font-inter"
            >
                {#each dayHeaders as day}
                    <div class="text-center">{day}</div>
                {/each}
            </div>

            <!-- Calendar Grid -->
            <div
                class="isolate grid grid-cols-7 gap-px rounded-lg bg-zinc-200 {calendarTextSize} shadow-sm ring-1 ring-zinc-200"
            >
                {#each calendarDays as day, index (day.dateString)}
                    <button
                        type="button"
                        onclick={() =>
                            selectDate(day.dateString, day.isDisabled)}
                        disabled={day.isDisabled}
                        class="{dayCellPadding} focus:z-10 transition-colors {index ===
                        0
                            ? 'rounded-tl-lg'
                            : ''} {index === 6
                            ? 'rounded-tr-lg'
                            : ''} {index === 35
                            ? 'rounded-bl-lg'
                            : ''} {index === 41
                            ? 'rounded-br-lg'
                            : ''} {day.isDisabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer hover:bg-zinc-100'} {!day.isCurrentMonth
                            ? 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                            : 'bg-white text-zinc-900 hover:bg-zinc-100'} {day.isSelected
                            ? 'font-semibold text-white'
                            : ''} {day.isToday && !day.isSelected
                            ? 'font-semibold'
                            : ''}"
                    >
                        <time
                            datetime={day.dateString}
                            class="mx-auto flex {dayCellSize} items-center justify-center rounded-full {day.isSelected &&
                            !day.isToday
                                ? 'bg-zinc-900 text-white'
                                : ''} {day.isSelected && day.isToday
                                ? 'bg-zinc-600 text-white'
                                : ''} {day.isToday && !day.isSelected
                                ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-400 ring-offset-1'
                                : ''}"
                        >
                            {day.date.getDate()}
                        </time>
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>
