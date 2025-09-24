#!/usr/bin/env python3
import re
import sys
import os
from pathlib import Path

def update_provider_config(content, filename):
    """Update provider configurations from 2-level to 3-level structure"""

    # Skip already updated files
    if 'default: {' in content and 'providers: {' in content:
        return content

    print(f"Processing {filename}...")

    # Pattern 1: Simple inline provider configs like { openai: { apiKey: "..." } }
    # This handles cases like:
    # providers: { openai: { apiKey: "sk-test" } }
    simple_pattern = r'(\w+):\s*\{\s*apiKey:\s*[^}]+\}'

    def replace_simple_provider(match):
        provider_name = match.group(1)
        full_config = match.group(0)
        # Extract just the config part after the provider name
        config_part = full_config[full_config.index('{'):]
        return f'{provider_name}: {{\n            default: {config_part},\n          }}'

    # Pattern 2: Multi-line provider configs
    # providers: {
    #   openai: { apiKey: "..." },
    #   anthropic: { apiKey: "..." }
    # }
    multiline_pattern = r'providers:\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'

    def replace_multiline_providers(match):
        providers_content = match.group(1)

        # Find all provider configs within this block
        provider_matches = list(re.finditer(simple_pattern, providers_content))

        if not provider_matches:
            return match.group(0)  # No changes needed

        result = "providers: {\n"

        # Process each provider
        for provider_match in provider_matches:
            provider_name = provider_match.group(1)
            config_start = provider_match.start(0) + len(provider_name) + 1  # Skip "name:"
            config_part = providers_content[config_start:provider_match.end(0)]
            config_part = config_part.strip()
            if config_part.endswith(','):
                config_part = config_part[:-1]

            result += f"          {provider_name}: {{\n            default: {config_part},\n          }},\n"

        result += "        }"
        return result

    # First try multiline pattern
    content = re.sub(multiline_pattern, replace_multiline_providers, content, flags=re.DOTALL)

    # Handle specific apiKey assignment patterns like openai: process.env.OPENAI_API_KEY
    env_pattern = r'(\w+):\s*process\.env\.(\w+)'
    def replace_env_assignment(match):
        provider = match.group(1).lower()
        env_var = match.group(2)
        return f'{provider}: {{\n            default: {{ apiKey: process.env.{env_var} }},\n          }}'

    content = re.sub(env_pattern, replace_env_assignment, content)

    # Handle helper function return patterns where we build config objects
    # Pattern like: return { openai: { apiKey: "..." } }
    return_pattern = r'return\s*\{\s*(\w+):\s*\{\s*apiKey:\s*[^}]+\}\s*\}'
    def replace_return_config(match):
        provider = match.group(1)
        config_start = match.group(0).find('{', match.group(0).find(':'))
        config_end = match.group(0).rfind('}')
        config_part = match.group(0)[config_start:config_end+1]
        return f'return {{\n    {provider}: {{\n      default: {config_part},\n    }},\n  }}'

    content = re.sub(return_pattern, replace_return_config, content)

    # Handle direct object literals in test files
    # const config = { providers: { openai: { ... } } }
    const_pattern = r'(const\s+\w+\s*=\s*\{[^}]*providers:\s*)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}([^}]*\})'
    def replace_const_config(match):
        prefix = match.group(1)
        providers_content = match.group(2)
        suffix = match.group(3)

        # Find provider configs
        provider_matches = list(re.finditer(simple_pattern, providers_content))

        if not provider_matches:
            return match.group(0)

        new_providers = "{\n"
        for provider_match in provider_matches:
            provider_name = provider_match.group(1)
            config_start = provider_match.start(0) + len(provider_name) + 1
            config_part = providers_content[config_start:provider_match.end(0)].strip()
            if config_part.endswith(','):
                config_part = config_part[:-1]
            new_providers += f"          {provider_name}: {{\n            default: {config_part},\n          }},\n"
        new_providers += "        }"

        return prefix + new_providers + suffix

    content = re.sub(const_pattern, replace_const_config, content, flags=re.DOTALL)

    return content

def main():
    # Files to process
    files = [
        "src/__tests__/createClient.test.ts",
        "src/__tests__/exports.test.ts",
        "src/client/__tests__/bridgeClient.test.ts",
        "src/client/__tests__/bridgeClientDisposal.test.ts",
        "src/client/__tests__/bridgeClientMcpIntegration.test.ts",
        "src/client/__tests__/bridgeClientRegistries.test.ts",
        "src/client/__tests__/bridgeClientToolIntegration.test.ts",
        "src/client/__tests__/bridgeClientErrorLogging.test.ts",
        "src/__tests__/e2e/anthropic/chat.e2e.test.ts",
        "src/__tests__/e2e/anthropic/mcpTools.e2e.test.ts",
        "src/__tests__/e2e/anthropic/stdioMcpTools.e2e.test.ts",
        "src/__tests__/e2e/google/chat.e2e.test.ts",
        "src/__tests__/e2e/google/mcpTools.e2e.test.ts",
        "src/__tests__/e2e/google/stdioMcpTools.e2e.test.ts",
        "src/__tests__/e2e/openai/chat.e2e.test.ts",
        "src/__tests__/e2e/openai/mcpTools.e2e.test.ts",
        "src/__tests__/e2e/openai/stdioMcpTools.e2e.test.ts",
        "src/__tests__/e2e/xai/chat.e2e.test.ts",
        "src/__tests__/e2e/xai/mcpTools.e2e.test.ts",
        "src/__tests__/e2e/xai/stdioMcpTools.e2e.test.ts",
        "src/__tests__/e2e/shared/anthropicModelHelpers.ts",
        "src/__tests__/e2e/shared/createMcpTestClient.ts",
        "src/__tests__/e2e/shared/createMcpTestConfig.ts",
        "src/__tests__/e2e/shared/googleModelHelpers.ts",
        "src/__tests__/e2e/shared/mcpTestHelpers.test.ts",
        "src/__tests__/e2e/shared/openAIModelHelpers.ts",
        "src/__tests__/e2e/shared/rateLimiting/createRateLimitedTestClient.ts",
        "src/__tests__/e2e/shared/xaiModelHelpers.ts",
        "src/core/agent/cancellation/__tests__/cancellationIntegration.test.ts",
        "src/core/config/__tests__/bridgeConfigSchema.test.ts",
        "src/core/config/__tests__/rateLimitingConfig.test.ts",
        "src/index.ts",
        "src/client/index.ts"
    ]

    for file_path in files:
        if not os.path.exists(file_path):
            print(f"Skipping {file_path} (not found)")
            continue

        try:
            with open(file_path, 'r') as f:
                content = f.read()

            updated_content = update_provider_config(content, file_path)

            if updated_content != content:
                with open(file_path, 'w') as f:
                    f.write(updated_content)
                print(f"Updated {file_path}")
            else:
                print(f"No changes needed for {file_path}")

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    main()