module edk.vector.pure.chunking;

import std.text.{join, len as text_len, lines};
import edk.vector.types.{ChunkingPolicy, TextChunk};

public flow chunking_policy(max_chars: usize, overlap_chars: usize) -> ChunkingPolicy ![] {
    return ChunkingPolicy {
        max_chars = max_chars,
        overlap_chars = overlap_chars,
    };
}

public flow default_chunking_policy() -> ChunkingPolicy ![] {
    return ChunkingPolicy {
        max_chars = 1200,
        overlap_chars = 120,
    };
}

public flow is_valid_chunking_policy(policy: ChunkingPolicy) -> bool ![] {
    if policy.max_chars <= 0 {
        return false;
    }
    if policy.overlap_chars >= policy.max_chars {
        return false;
    }
    return true;
}

public flow line_chunking_policy(max_chars: usize) -> ChunkingPolicy ![] {
    return ChunkingPolicy {
        max_chars = max_chars,
        overlap_chars = 0,
    };
}

public flow is_valid_line_chunking_policy(policy: ChunkingPolicy) -> bool ![] {
    if !is_valid_chunking_policy(policy) {
        return false;
    }
    return policy.overlap_chars == 0;
}

public flow line_chunks(text: string) -> Array<TextChunk> ![] {
    let parts = lines(text);
    var chunks: Array<TextChunk> = [];
    var index = 0;
    for part in parts limit Iterations(65536) {
        chunks = chunks.push(TextChunk { index = index, text = part });
        index = index + 1;
    }
    return chunks;
}

public flow line_chunks_with_policy(text: string, policy: ChunkingPolicy) -> Array<TextChunk> ![] {
    let empty: Array<TextChunk> = [];
    if !is_valid_line_chunking_policy(policy) {
        return empty;
    }

    let parts = lines(text);
    var chunks: Array<TextChunk> = [];
    var buffer: Array<string> = [];
    var buffer_text = "";
    var has_buffer = false;
    var chunk_index = 0;

    for part in parts limit Iterations(65536) {
        if !has_buffer {
            buffer = [part];
            buffer_text = part;
            has_buffer = true;
        } else {
            let projected = text_len(buffer_text) + 1 + text_len(part);
            if projected <= policy.max_chars {
                buffer = buffer.push(part);
                buffer_text = join(buffer, "\n");
            } else {
                chunks = chunks.push(TextChunk { index = chunk_index, text = buffer_text });
                chunk_index = chunk_index + 1;
                buffer = [part];
                buffer_text = part;
                has_buffer = true;
            }
        }
    }

    if has_buffer {
        chunks = chunks.push(TextChunk { index = chunk_index, text = buffer_text });
    }

    return chunks;
}
