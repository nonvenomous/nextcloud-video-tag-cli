#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");

// Command-Line Interface

const program = new Command();
program
  .version("1.0.0")
  .description("Nextcloud file to video tag CLI Tool")
  .argument("<filePath...>", "Nautilus WebDAV file path")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (filePathArgs, options) => {
    const verbose = options.verbose;
    const logger = createLogger(verbose);

    try {
      // Join the filePath arguments in case they were split due to missing quotes
      const filePath = filePathArgs.join(" ");

      const hasAnyExtension = path.extname(filePath) !== "";
      if (!hasAnyExtension) {
        console.error(
          "Error: The provided file path seems incomplete or does not have a file extension.",
        );
        process.exit(1);
      }

      logger("Starting process...");
      const videoTag = await processFilePath(filePath, logger);
      logger("\nGenerated <video> Tag:\n");
      console.log(videoTag);
      process.exit(0);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  });

program.parse(process.argv);

function createLogger(verbose) {
  return function (message) {
    if (verbose) {
      console.log(message);
    }
  };
}

// Main Function
async function processFilePath(localFilePath, logger) {
  const {
    NEXTCLOUD_USERNAME,
    NEXTCLOUD_PASSWORD,
    NEXTCLOUD_DOMAIN,
    SHARE_PASSWORD,
  } = process.env;

  if (!NEXTCLOUD_USERNAME || !NEXTCLOUD_PASSWORD || !NEXTCLOUD_DOMAIN) {
    throw new Error(
      "Missing Nextcloud credentials or domain in environment variables.",
    );
  }

  logger("Parsing Nautilus WebDAV file path...");
  const remoteFilePath = getRemoteFilePath(localFilePath);

  logger(`Remote file path obtained: ${remoteFilePath}`);

  logger("Creating share link...");
  const shareToken = await createShareLink(
    remoteFilePath,
    NEXTCLOUD_USERNAME,
    NEXTCLOUD_PASSWORD,
    NEXTCLOUD_DOMAIN,
    SHARE_PASSWORD,
    logger,
  );

  logger(`Share token received: ${shareToken}`);

  logger("Constructing direct download link...");
  const fileName = path.basename(remoteFilePath);
  const directDownloadLink = `https://${NEXTCLOUD_DOMAIN}/s/${shareToken}/download/${encodeURIComponent(fileName)}`;

  logger(`Direct download link: ${directDownloadLink}`);

  logger("Generating <video> tag...");
  const videoTag = `<video src="${directDownloadLink}" controls width="300"></video>`;

  return videoTag;
}

function getRemoteFilePath(localFilePath) {
  // Regular expression to match the mount point and extract the prefix
  const mountPointPattern = /^(.+?prefix=([^/]+))/;
  const match = localFilePath.match(mountPointPattern);

  if (!match) {
    throw new Error("Invalid Nautilus WebDAV file path.");
  }

  const mountPoint = match[1]; // The entire mount point up to the prefix

  // The remote path is the part of the localFilePath after the mount point
  const remoteFilePathEncoded = localFilePath.substring(mountPoint.length);

  const remoteFilePath = decodeURIComponent(remoteFilePathEncoded);

  return remoteFilePath.startsWith("/") ? remoteFilePath : "/" + remoteFilePath;
}

async function createShareLink(
  filePath,
  username,
  password,
  domain,
  sharePassword,
  logger,
) {
  const shareUrl = `https://${domain}/ocs/v2.php/apps/files_sharing/api/v1/shares`;

  const params = new URLSearchParams();
  params.append("path", filePath);
  params.append("shareType", "3"); // Public link
  params.append("permissions", "1"); // Read-only
  params.append("label", "nextcloud-video-tag-cli");

  if (sharePassword) {
    params.append("password", sharePassword);
  }

  const auth = `${username}:${password}`;
  const headers = {
    "OCS-APIRequest": "true",
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + Buffer.from(auth).toString("base64"),
    Accept: "application/json",
  };

  const response = await fetch(shareUrl, {
    method: "POST",
    headers: headers,
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  const data = await response.json();

  const statusCode = data.ocs.meta.statuscode;
  const message = data.ocs.meta.message;

  if (statusCode !== 100 && statusCode !== 200) {
    throw new Error(`Failed to create share link: ${message}`);
  }

  return data.ocs.data.token;
}
