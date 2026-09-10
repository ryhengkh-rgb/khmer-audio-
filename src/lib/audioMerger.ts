import fs from 'fs';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export const mergeAudioFiles = (inputFiles: string[], outputFile: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (inputFiles.length === 0) {
      reject(new Error('No input files to merge'));
      return;
    }

    if (inputFiles.length === 1) {
      fs.copyFileSync(inputFiles[0], outputFile);
      resolve();
      return;
    }

    // Use fluent-ffmpeg to concatenate files.
    // fluent-ffmpeg's mergeToFile creates a temporary file with a list of inputs and uses the concat demuxer or filter.
    const command = ffmpeg();
    inputFiles.forEach(file => {
      command.input(file);
    });

    command
      .on('error', (err) => {
        console.error('Error merging files:', err);
        reject(err);
      })
      .on('end', () => {
        resolve();
      })
      .mergeToFile(outputFile, os.tmpdir());
  });
};
