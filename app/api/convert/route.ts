import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { convertJsonToCsv } from '../../utils/jsonToCsv';

export async function POST(request: Request) {
  try {
    // Create csv_reports directory if it doesn't exist
    const csvDir = path.join(process.cwd(), 'csv_reports');
    await fs.mkdir(csvDir, { recursive: true });

    // Read all JSON files from json_reports directory
    const jsonDir = path.join(process.cwd(), 'json_reports');
    await fs.mkdir(jsonDir, { recursive: true }); // Create json_reports if it doesn't exist
    
    const files = await fs.readdir(jsonDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const results: string[] = [];
    const errors: string[] = [];

    // Process each JSON file
    for (const file of jsonFiles) {
      try {
        const jsonPath = path.join(jsonDir, file);
        const jsonContent = await fs.readFile(jsonPath, 'utf-8');
        
        // Pass the raw JSON string to the conversion function
        const csvContent = convertJsonToCsv(jsonContent);

        // Create CSV file with the same name
        const csvFileName = file.replace('.json', '.csv');
        const csvPath = path.join(csvDir, csvFileName);
        await fs.writeFile(csvPath, csvContent, 'utf-8');
        
        results.push(`Successfully created ${csvFileName}`);
      } catch (error) {
        const fileError = error as Error;
        errors.push(`Error processing ${file}: ${fileError.message}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Some files could not be processed',
        details: {
          successes: results,
          errors: errors
        }
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${results.length} CSV files`,
      details: {
        successes: results
      }
    });
  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json({
      success: false,
      message: `Error processing files: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS'
    }
  });
}