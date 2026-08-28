#!/usr/bin/env node

/**
 * Antigravity PreToolUse Hook: Security & Permission Guard
 * Converted from .claude/settings.local.json
 */

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function normalizePath(filePath) {
  if (!filePath) return '';
  return filePath.replace(/\\/g, '/');
}

function evaluateToolCall(toolCall) {
  if (!toolCall || !toolCall.name) {
    return { decision: 'allow' };
  }

  const toolName = toolCall.name;
  const args = toolCall.args || {};

  // 1. run_command
  if (toolName === 'run_command') {
    const cmd = (args.CommandLine || '').trim();

    // Deny checks
    const denyPatterns = [
      { pattern: /(?:^|\s|;|&&|\|\|)(?:rm|rmdir|Remove-Item)(?:\s|$)/i, reason: 'rm/削除系コマンドの実行は禁止されています。' },
      { pattern: /(?:^|\s|;|&&|\|\|)curl(?:\s|$)/i, reason: 'curl コマンドの実行は禁止されています。' },
      { pattern: /(?:^|\s|;|&&|\|\|)wget(?:\s|$)/i, reason: 'wget コマンドの実行は禁止されています。' },
      { pattern: /(?:^|\s|;|&&|\|\|)nc(?:\s|$)/i, reason: 'nc コマンドの実行は禁止されています。' },
      { pattern: /(?:^|\s|;|&&|\|\|)ssh(?:\s|$)/i, reason: 'ssh コマンドの実行は禁止されています。' },
      { pattern: /(?:^|\s|;|&&|\|\|)git\s+push(?:\s|$)/i, reason: 'git push の実行は禁止されています。' }
    ];

    for (const { pattern, reason } of denyPatterns) {
      if (pattern.test(cmd)) {
        return { decision: 'deny', reason };
      }
    }

    // Allow checks
    const allowPatterns = [
      /^(?:npm\s+(?:install|run|test|ci)|npx\s+(?:tsc|prettier|eslint)|git\s+(?:status|diff|log)|ls|cat|grep|node\s+-v|git\s+-C\s+\S+\s+log)/i
    ];

    for (const pattern of allowPatterns) {
      if (pattern.test(cmd)) {
        return { decision: 'allow' };
      }
    }

    // Ask checks (other git commands)
    if (/^git\s+/i.test(cmd)) {
      return { decision: 'ask', reason: `Git操作 (${cmd}) の実行確認が必要です。` };
    }

    return { decision: 'allow' };
  }

  // 2. view_file
  if (toolName === 'view_file') {
    const targetPath = normalizePath(args.AbsolutePath || '');

    // Allow sample/example env files
    if (/\.env\.(?:sample|example)$/i.test(targetPath)) {
      return { decision: 'allow' };
    }

    // Deny sensitive files
    if (/(?:^|\/)\.env(?:$|\..+)/i.test(targetPath)) {
      return { decision: 'deny', reason: '.env 環境変数ファイルの閲覧はセキュリティ上禁止されています。' };
    }

    const sensitivePathPatterns = [
      /\/\.ssh\//i,
      /\/\.gnupg\//i,
      /\/\.aws\//i,
      /\/\.azure\//i,
      /\/\.kube\//i,
      /\/\.npmrc$/i,
      /\/\.git-credentials$/i,
      /\/\.config\/gh\//i
    ];

    for (const pattern of sensitivePathPatterns) {
      if (pattern.test(targetPath)) {
        return { decision: 'deny', reason: '機密・認証情報の含まれるファイルへのアクセスは禁止されています。' };
      }
    }

    return { decision: 'allow' };
  }

  // 3. replace_file_content / multi_replace_file_content / write_to_file
  if (['replace_file_content', 'multi_replace_file_content', 'write_to_file'].includes(toolName)) {
    const targetPath = normalizePath(args.TargetFile || '');

    const forbiddenEditPatterns = [
      /\/\.bashrc$/i,
      /\/\.bash_profile$/i,
      /\/\.zshrc$/i,
      /\/\.config\/fish\//i
    ];

    for (const pattern of forbiddenEditPatterns) {
      if (pattern.test(targetPath)) {
        return { decision: 'deny', reason: 'シェル設定ファイルの編集はセキュリティ上禁止されています。' };
      }
    }

    return { decision: 'allow' };
  }

  return { decision: 'allow' };
}

async function main() {
  const input = await readStdin();
  const result = evaluateToolCall(input.toolCall);
  process.stdout.write(JSON.stringify(result));
}

main().catch(() => {
  // Fail-safe
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
});
