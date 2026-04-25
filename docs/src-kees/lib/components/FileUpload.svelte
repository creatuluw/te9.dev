<script lang="ts">
	import { FileUp } from 'lucide-svelte';

	/**
	 * File upload variant styles
	 * - simple: Basic file input button
	 * - drag-drop: Drag and drop zone with visual feedback
	 */
	type FileUploadVariant = 'simple' | 'drag-drop';
	
	/**
	 * File upload size
	 * - sm: Small size
	 * - default: Standard size
	 * - lg: Large size
	 */
	type FileUploadSize = 'default' | 'sm' | 'lg';

	/**
	 * FileUpload component props
	 * 
	 * File upload component with drag-and-drop support and file validation.
	 */
	interface Props {
		/**
		 * Upload variant style
		 * @default 'drag-drop'
		 */
		variant?: FileUploadVariant;
		
		/**
		 * Component size
		 * @default 'default'
		 */
		size?: FileUploadSize;
		
		/**
		 * HTML accept attribute (e.g., "image/*", ".pdf")
		 */
		accept?: string;
		
		/**
		 * Allow multiple file selection
		 * @default false
		 */
		multiple?: boolean;
		
		/**
		 * Disable the upload component
		 * @default false
		 */
		disabled?: boolean;
		
		/**
		 * Maximum file size in bytes
		 * @example
		 * ```typescript
		 * <FileUpload maxSize={5 * 1024 * 1024} /> // 5MB
		 * ```
		 */
		maxSize?: number;
		
		/**
		 * Array of accepted file types (validated client-side)
		 * @example
		 * ```typescript
		 * <FileUpload acceptedFileTypes={['.pdf', '.doc', 'image/png']} />
		 * ```
		 */
		acceptedFileTypes?: string[];
		
		/**
		 * Label text displayed above upload area
		 */
		label?: string;
		
		/**
		 * Description text displayed below label
		 */
		description?: string;
		
		/**
		 * Placeholder text in upload area
		 * @default 'Upload a file'
		 */
		placeholder?: string;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Change event handler
		 * @param files - Selected files (null if cleared)
		 * @example
		 * ```typescript
		 * <FileUpload 
		 *   onchange={(files) => {
		 *     if (files) {
		 *       Array.from(files).forEach(file => uploadFile(file));
		 *     }
		 *   }}
		 * />
		 * ```
		 */
		onchange?: (files: FileList | null) => void;
		
		/**
		 * Error event handler (fires on validation errors)
		 * @param error - Error message
		 * @example
		 * ```typescript
		 * <FileUpload 
		 *   onerror={(error) => toastStore.add(error, 'error')}
		 * />
		 * ```
		 */
		onerror?: (error: string) => void;
	}

	let {
		variant = 'drag-drop',
		size = 'default',
		accept,
		multiple = false,
		disabled = false,
		maxSize,
		acceptedFileTypes,
		label,
		description,
		placeholder = 'Upload a file',
		class: className = '',
		onchange,
		onerror,
		...restProps
	}: Props = $props();

	let inputElement = $state<HTMLInputElement | undefined>(undefined);
	let isDragging = $state(false);
	let selectedFiles = $state<File[]>([]);
	let errorMessage = $state<string | null>(null);
	const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`;

	function handleFileSelect(files: FileList | null) {
		if (!files || files.length === 0) return;

		errorMessage = null;
		const filesArray = Array.from(files);

		// Validate file types if specified
		if (acceptedFileTypes && acceptedFileTypes.length > 0) {
			for (const file of filesArray) {
				const fileType = file.type || file.name.split('.').pop()?.toLowerCase();
				const isValid = acceptedFileTypes.some((type) => {
					if (type.startsWith('.')) {
						return file.name.toLowerCase().endsWith(type.toLowerCase());
					}
					return fileType?.includes(type.toLowerCase());
				});

				if (!isValid) {
					const error = `File type not allowed. Accepted types: ${acceptedFileTypes.join(', ')}`;
					errorMessage = error;
					onerror?.(error);
					return;
				}
			}
		}

		// Validate file size if specified
		if (maxSize) {
			for (const file of filesArray) {
				if (file.size > maxSize) {
					const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
					const error = `File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`;
					errorMessage = error;
					onerror?.(error);
					return;
				}
			}
		}

		selectedFiles = multiple ? [...selectedFiles, ...filesArray] : filesArray;
		onchange?.(files);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragging = false;

		if (disabled) return;

		const files = event.dataTransfer?.files;
		if (files) {
			handleFileSelect(files);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (!disabled) {
			isDragging = true;
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragging = false;
	}

	function handleInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		handleFileSelect(target.files);
	}

	function handleButtonClick() {
		if (!disabled && inputElement) {
			inputElement.click();
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
		if (inputElement) {
			inputElement.value = '';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	function formatAcceptedTypes(): string {
		if (acceptedFileTypes && acceptedFileTypes.length > 0) {
			return acceptedFileTypes.map((type) => type.toUpperCase()).join(', ');
		}
		if (accept) {
			return accept.split(',').map((type) => type.trim().toUpperCase().replace('*', '')).join(', ');
		}
		return 'Any file type';
	}
</script>

<div class="space-y-2 {className}">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-zinc-900 font-aspekta">{label}</label>
	{/if}

	{#if variant === 'simple'}
		<div class="flex items-center gap-x-3">
			<button
				type="button"
				onclick={handleButtonClick}
				disabled={disabled}
				class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-xs border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed font-aspekta"
				{...restProps}
			>
				{placeholder}
			</button>
			<input
				bind:this={inputElement}
				type="file"
				{accept}
				{multiple}
				{disabled}
				class="sr-only"
				onchange={handleInputChange}
			/>
			{#if selectedFiles.length > 0}
				<span class="text-sm text-zinc-600 font-inter">
					{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
				</span>
			{/if}
		</div>
	{:else}
		<div
			class="flex justify-center rounded-lg border border-dashed transition-colors cursor-pointer"
			class:px-6={size === 'default' || size === 'lg'}
			class:py-10={size === 'default'}
			class:py-16={size === 'lg'}
			class:px-4={size === 'sm'}
			class:py-3={size === 'sm'}
			class:border-zinc-300={!isDragging && !disabled}
			class:border-zinc-400={isDragging && !disabled}
			class:border-zinc-200={disabled}
			class:bg-zinc-50={isDragging && !disabled}
			class:bg-white={!isDragging}
			class:opacity-50={disabled}
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			onclick={handleButtonClick}
			role="button"
			tabindex={disabled ? -1 : 0}
			onkeydown={(e) => {
				if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
					e.preventDefault();
					handleButtonClick();
				}
			}}
		>
			<div class="text-center">
				<FileUp 
					class="mx-auto text-zinc-400 {size === 'default' || size === 'lg' ? 'size-12' : 'size-8'}" 
					aria-hidden="true" 
				/>
				<div 
					class="flex text-zinc-600 font-inter"
					class:mt-4={size === 'default' || size === 'lg'}
					class:mt-1.5={size === 'sm'}
					class:text-sm={size === 'default' || size === 'lg'}
					class:text-xs={size === 'sm'}
				>
					<label
						for={inputId}
						class="relative cursor-pointer rounded-md bg-transparent font-semibold text-zinc-900 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-zinc-600 hover:text-zinc-700 disabled:cursor-not-allowed font-aspekta"
					>
						<span>{placeholder}</span>
					</label>
						<input
							bind:this={inputElement}
							id={inputId}
							type="file"
							class="sr-only"
							{accept}
							{multiple}
							{disabled}
							onchange={handleInputChange}
							{...restProps}
						/>
					<p class="pl-1">or drag and drop</p>
				</div>
				{#if description}
					<p 
						class="text-zinc-500 font-inter"
						class:text-xs={size === 'default' || size === 'lg'}
						class:text-[10px]={size === 'sm'}
						class:mt-2={size === 'default' || size === 'lg'}
						class:mt-0.5={size === 'sm'}
					>{description}</p>
				{:else}
					<p 
						class="text-zinc-500 font-inter"
						class:text-xs={size === 'default' || size === 'lg'}
						class:text-[10px]={size === 'sm'}
						class:mt-2={size === 'default' || size === 'lg'}
						class:mt-0.5={size === 'sm'}
					>
						{formatAcceptedTypes()}
						{#if maxSize}
							up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
						{/if}
					</p>
				{/if}
			</div>
		</div>
	{/if}

	{#if errorMessage}
		<p class="text-sm text-red-600 font-inter">{errorMessage}</p>
	{/if}

	{#if selectedFiles.length > 0 && variant === 'drag-drop'}
		<div class="mt-4 space-y-2">
			{#each selectedFiles as file, index}
				<div class="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2">
					<div class="flex items-center gap-2 flex-1 min-w-0">
						<svg
							viewBox="0 0 24 24"
							fill="currentColor"
							class="size-5 text-zinc-400 shrink-0"
						>
							<path
								d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z"
							/>
						</svg>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-zinc-900 truncate font-aspekta">{file.name}</p>
							<p class="text-xs text-zinc-500 font-inter">{formatFileSize(file.size)}</p>
						</div>
					</div>
					{#if !disabled && (!multiple || selectedFiles.length > 1)}
						<button
							type="button"
							onclick={() => removeFile(index)}
							class="ml-2 rounded-md p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
							aria-label="Remove file"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-4">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

