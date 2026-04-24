# Qwen3.5-2B LLM Gateway Dockerfile for Railway Deployment
# CPU-only inference server with OpenAI-compatible API
# Uses llama.cpp with built-in Hugging Face download feature
# Model: unsloth/Qwen3.5-2B-GGUF (Q4_K_M, ~1.4 GB, 2B params)

# ============================================
# Stage 1: Build llama.cpp
# ============================================
FROM ubuntu:24.04 AS builder

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Force IPv4 to avoid IPv6 connectivity issues and use regional mirror for asia-southeast1
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4 && \
    sed -i 's|http://archive.ubuntu.com/ubuntu|http://ap-southeast-1.ec2.archive.ubuntu.com/ubuntu|g; s|http://security.ubuntu.com/ubuntu|http://ap-southeast-1.ec2.archive.ubuntu.com/ubuntu|g' /etc/apt/sources.list.d/ubuntu.sources 2>/dev/null || \
    sed -i 's|http://archive.ubuntu.com/ubuntu|http://ap-southeast-1.ec2.archive.ubuntu.com/ubuntu|g; s|http://security.ubuntu.com/ubuntu|http://ap-southeast-1.ec2.archive.ubuntu.com/ubuntu|g' /etc/apt/sources.list 2>/dev/null || true

# Install build dependencies (including OpenSSL and curl for HuggingFace download support)
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    libssl-dev \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone and build llama.cpp
WORKDIR /build
RUN git clone https://github.com/ggerganov/llama.cpp.git

WORKDIR /build/llama.cpp
RUN cmake -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_SHARED_LIBS=OFF \
    -DGGML_NATIVE=OFF \
    -DGGML_CUDA=OFF \
    -DLLAMA_OPENSSL=ON \
    && cmake --build build --config Release -j$(nproc) \
    && cp build/bin/llama-server /usr/local/bin/ \
    && cp build/bin/llama-cli /usr/local/bin/

# ============================================
# Stage 2: Runtime image
# ============================================
FROM ubuntu:24.04

# Labels for identification
LABEL maintainer="Research Agent Team"
LABEL description="Qwen3.5-2B LLM Gateway with OpenAI-compatible API"
LABEL version="2.1.0"

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Force IPv4 and use regional mirror for asia-southeast1
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4 && \
    sed -i 's|http://archive.ubuntu.com/ubuntu|http://ap-southeast-1.ec2.archive.ubuntu.com/ubuntu|g; s|http://security.ubuntu.com/ubuntu|http://ap-southeast-1.ec2.archive.ubuntu.com/ubuntu|g' /etc/apt/sources.list.d/ubuntu.sources 2>/dev/null || \
    sed -i 's|http://archive.ubuntu.com/ubuntu|http://ap-southeast-1.ec2.archive.ubuntu.com/ubuntu|g; s|http://security.ubuntu.com/ubuntu|http://ap-southeast-1.ec2.archive.ubuntu.com/ubuntu|g' /etc/apt/sources.list 2>/dev/null || true

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    libgomp1 \
    libssl3t64 \
    libcurl4t64 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN useradd -m -u 10001 -s /bin/bash llm

# Copy llama-server binary from builder
COPY --from=builder /usr/local/bin/llama-server /usr/local/bin/llama-server
COPY --from=builder /usr/local/bin/llama-cli /usr/local/bin/llama-cli

# Create models directory with proper permissions
RUN mkdir -p /models && chown -R llm:llm /models

# Environment variables with Railway-compatible defaults
ENV HOST=0.0.0.0 \
    PORT=8080

# Expose the default port
EXPOSE 8080

# Switch to non-root user
USER llm

# Health check with extended start period for model download
# First startup downloads the ~1.4 GB Q4_K_M model from Hugging Face
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Working directory
WORKDIR /app

# Start the llama.cpp server with Qwen3.5-2B model
# Configuration optimized for Railway CPU-only environment:
# - -hf: Download model directly from Hugging Face (Q4_K_M ~1.4 GB)
# - --host 0.0.0.0: Bind to all interfaces (required for Railway)
# - --port: Use Railway's PORT env variable
# - --ctx-size 262000: Full 262K context window for Qwen3.5
# - --n-gpu-layers 0: No GPU layers (CPU-only inference)
# - -t 4: Use 4 threads (adjust based on Railway instance size)
# - -b 512: Batch size for processing
# - --alias: Model identifier for API responses
# - Sampling parameters from Qwen3.5 docs (non-thinking mode):
#   --temp 0.7 --top-p 0.8 --top-k 20 --presence-penalty 1.5
# - --chat-template-kwargs: Disable thinking mode for direct answers
CMD ["sh", "-c", "llama-server -hf unsloth/Qwen3.5-2B-GGUF:Q4_K_M --host 0.0.0.0 --port ${PORT:-8080} --ctx-size 262000 --n-gpu-layers 0 --threads 4 --batch-size 512 --alias unsloth/Qwen3.5-2B-GGUF --temp 0.7 --top-p 0.8 --top-k 20 --presence-penalty 1.5 --chat-template-kwargs '{\"enable_thinking\":false}' --metrics"]
