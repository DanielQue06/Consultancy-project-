// app/api/scan/route.ts
import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST() {
  const possibleRoots = [
    path.join(process.cwd(), "..", ".."),
    path.join(process.cwd(), ".."),
    path.join(process.cwd(), "..", "..", ".."),
  ];

  let projectRoot = "";
  for (const root of possibleRoots) {
    if (fs.existsSync(path.join(root, "main.py"))) {
      projectRoot = root;
      break;
    }
  }

  if (!projectRoot) {
    return NextResponse.json({
      success: false,
      output: `Could not find main.py. Searched:\n${possibleRoots.map(p => `  - ${p}`).join("\n")}\n\ncwd: ${process.cwd()}`,
    }, { status: 500 });
  }

  return new Promise<NextResponse>((resolve) => {
    execFile(
      "python",
      ["main.py"],
      { cwd: projectRoot, timeout: 600000 },
      (error, stdout, stderr) => {
        if (error) {
          resolve(
            NextResponse.json({
              success: false,
              output: `Error: ${error.message}\n\nStderr: ${stderr}\n\nStdout: ${stdout}\n\nRan from: ${projectRoot}`,
            }, { status: 500 })
          );
          return;
        }

        resolve(
          NextResponse.json({
            success: true,
            output: stdout || "Scan completed with no output.",
          })
        );
      }
    );
  });
}