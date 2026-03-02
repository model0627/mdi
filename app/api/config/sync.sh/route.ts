import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config', 'mdi-config.json');

interface MdiConfig {
  version: number;
  updatedAt: string;
  claudeBlock: string;
}

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId');

  if (!memberId) {
    return new NextResponse('# Error: memberId is required\nexit 1\n', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    return new NextResponse('# Error: Config not found\nexit 1\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  let config: MdiConfig;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as MdiConfig;
  } catch {
    return new NextResponse('# Error: Failed to read config\nexit 1\n', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const claudeBlock = config.claudeBlock.replace(/\{\{MEMBER_ID\}\}/g, memberId);
  const version = config.version;

  const script = `#!/bin/bash
# MDI Config Sync Script — Member: ${memberId}
# Config version: ${version}
# Generated: ${new Date().toISOString()}

set -e

CLAUDE_GLOBAL="$HOME/.claude/CLAUDE.md"
MDI_VERSION_FILE="$HOME/.mdi-version"

echo "=== MDI Config Sync ==="
echo "Member ID: ${memberId}"
echo "Config version: ${version}"
echo ""

# Ensure CLAUDE.md exists
if [ ! -f "$CLAUDE_GLOBAL" ]; then
  mkdir -p "$(dirname "$CLAUDE_GLOBAL")"
  touch "$CLAUDE_GLOBAL"
fi

# Remove existing MDI block if present
if grep -q "MDI_BLOCK_END" "$CLAUDE_GLOBAL" 2>/dev/null; then
  echo "Removing existing MDI block..."
  python3 -c "
import re
content = open('$CLAUDE_GLOBAL').read()
cleaned = re.sub(r'## MDI 대시보드.*?<!-- MDI_BLOCK_END -->', '', content, flags=re.DOTALL)
open('$CLAUDE_GLOBAL', 'w').write(cleaned.strip() + '\\n')
"
fi

# Append updated MDI block
cat >> "$CLAUDE_GLOBAL" << 'MDISYNCEOF'

${claudeBlock}
MDISYNCEOF

echo "MDI block updated in $CLAUDE_GLOBAL"

# Save current version
echo "${version}" > "$MDI_VERSION_FILE"
echo "Version ${version} saved to $MDI_VERSION_FILE"

echo ""
echo "=== Sync complete! ==="
echo "Please restart Claude Code for changes to take effect."
`;

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="mdi-sync-${memberId}.sh"`,
    },
  });
}
