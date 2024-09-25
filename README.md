# Nextcloud Video Embed CLI Tool

A simple Node.js command-line tool that automates the process of generating a `<video>` HTML tag for embedding videos from Nextcloud into applications like Obsidian\.md. It parses a Nautilus WebDAV file path, creates a share link using Nextcloud APIs, and outputs the final `<video>` tag with a direct download link.

## Prerequisites

- **Node.js**: Version **20** or newer is required for the native `fetch` API support and experimental [support for .envfiles](https://nodejs.org/dist/latest-v20.x/docs/api/cli.html#--env-fileconfig).
- **Nextcloud Account**: Access to a Nextcloud instance with appropriate permissions.
- **Nautilus (GNOME Files)**: If you're using Nautilus WebDAV paths.

## Installation

1. **Clone the Repository**

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**

> Note you have to create a app-password for [Nextcloud WebDAV](https://docs.nextcloud.com/server/23/user_manual/en/files/access_webdav.html?highlight=app%20password)

   ```bash
   cp .env.example .env
   touch .env # add Nextcloud credentials
   ```

## Usage

### Basic Command

```bash
./index.js "<nautilus_webdav_file_path>"
# or
node --env-file=.env index.js "<nautilus_webdav_file_path>"
```

### Example

```bash
./index.js "/run/user/1000/gvfs/dav:host=cloud.domain.dev,ssl=true,user=Admin,prefix=%2Fremote.php%2Fwebdav/Videos/sample-video.mp4"

# output
<video src="https://cloud.domain.dev/s/kCrncbqTSKLr6/download/sample-video.mp4" controls width="300"></video>
```

## License

This project is licensed under the MIT License.
