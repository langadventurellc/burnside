#!/usr/bin/env python3
import re
import sys

def update_provider_configs(content):
    """Update 2-level provider configs to 3-level configs"""

    # Pattern to match simple provider configs like:
    # providers: { openai: { apiKey: "sk-test" } }
    simple_pattern = r'providers:\s*\{\s*(\w+):\s*\{\s*([^}]+)\s*\}\s*\}'

    def replace_simple(match):
        provider = match.group(1)
        config = match.group(2).strip()
        return f'providers: {{\n          {provider}: {{\n            default: {{ {config} }},\n          }},\n        }}'

    # First handle simple single-provider cases
    content = re.sub(simple_pattern, replace_simple, content)

    # Pattern for multi-provider configs like:
    # providers: {
    #   openai: { apiKey: "sk-test" },
    #   anthropic: { apiKey: "sk-ant-test" },
    # }
    multi_pattern = r'providers:\s*\{([^}]+(?:\{[^}]+\}[^}]*)+)\}'

    def replace_multi(match):
        providers_content = match.group(1)

        # Find individual provider configs
        provider_pattern = r'(\w+):\s*\{([^}]+)\}'
        providers = re.findall(provider_pattern, providers_content)

        if len(providers) <= 1:
            return match.group(0)  # Don't change if already handled or malformed

        result = "providers: {\n"
        for provider, config in providers:
            config = config.strip()
            if config.endswith(','):
                config = config[:-1]
            result += f"          {provider}: {{\n            default: {{ {config} }},\n          }},\n"
        result += "        }"

        return result

    # Handle multi-provider cases
    content = re.sub(multi_pattern, replace_multi, content, flags=re.DOTALL)

    return content

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 update_providers.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        with open(file_path, 'r') as f:
            content = f.read()

        updated_content = update_provider_configs(content)

        with open(file_path, 'w') as f:
            f.write(updated_content)

        print(f"Successfully updated {file_path}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()