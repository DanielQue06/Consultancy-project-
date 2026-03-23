import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const projectRoot = path.resolve(process.cwd(), '..', '..');

    const { stdout, stderr } = await execAsync(
      'python report_generator/report_generator.py',
      {
        cwd: projectRoot,
        env: { ...process.env, PYTHONPATH: projectRoot }
      }
    );

    // Try to extract the file path from stdout
    const match = stdout.match(/report generated:\s*(.+\.html)/i);
    
    if (match) {
      let reportPath = match[1].trim();
      
      // If it's already an absolute path, use it directly
      // If it's relative, join with projectRoot
      if (!path.isAbsolute(reportPath)) {
        reportPath = path.join(projectRoot, reportPath);
      }

      const htmlContent = fs.readFileSync(reportPath, 'utf-8');
      return NextResponse.json({ success: true, html: htmlContent, message: stdout.trim() });
    }

    // Fallback: look in shared/reports/
    const reportsDir = path.join(projectRoot, 'shared', 'reports');
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir)
        .filter(f => f.endsWith('.html'))
        .sort()
        .reverse();
      
      if (files.length > 0) {
        const htmlContent = fs.readFileSync(path.join(reportsDir, files[0]), 'utf-8');
        return NextResponse.json({ success: true, html: htmlContent, message: stdout.trim() });
      }
    }

    return NextResponse.json({ success: true, html: null, message: 'Report generated but file not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}