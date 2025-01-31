/*
 * Electron Forge Config (configForge.js)
 */

// Let's import some keys from the package.json:

import { packageJson } from '../global';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path'
import { ForgeConfigFile } from './forge.d';


// Global variables in the config:
const iconFile = "sources/assets/icons/app";
const desktopGeneric = "Internet Messenger";
const desktopCategories = (["Network", "InstantMessaging"] as unknown as ["Network"]);

// Some custom functions

function getCommit():string {
  const projectPath = resolve(__dirname, '../../..')
  const refsPath = readFileSync(resolve(projectPath, '.git/HEAD'))
    .toString()
    .split(': ')[1]
    .trim();
  return readFileSync(resolve(projectPath, '.git', refsPath)).toString().trim();
}

function getBuildID() {
  switch(process.env.WEBCORD_BUILD?.toLocaleLowerCase()) {
    case "release":
    case "stable":
      return "release";
    default:
      return "devel";
  }
}

const config: ForgeConfigFile = {
  buildIdentifier: getBuildID,
  packagerConfig: {
    executableName: packageJson.name, // name instead of the productName
    asar: (process.env.WEBCORD_ASAR ? true : false),
    icon: iconFile, // used in Windows and MacOS binaries
    extraResource: [
      "LICENSE",
      iconFile + ".png"
    ],
    quiet: true,
    ignore: [
      // Directories:
      /sources\/app\/.build/,
      // Files:
      /\.eslintrc\.json/,
      /tsconfig\.json/,
      /sources\/app\/forge\/config\..*/,
      /sources\/code\/.*/,
      /sources\/assets\/icons\/app\..*/,
      // Hidden (for *nix OSes) files:
      /^\.[a-z]+$/,
      /.*\/\.[a-z]+$/
    ]
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "win32",
        "darwin"
      ],
    },
    {
      name: "electron-forge-maker-appimage",
      config: {
        options: {
          icon: iconFile + ".png",
          genericName: desktopGeneric,
          categories: desktopCategories,
          compression: "gzip" // "xz" is too slow for the Electron AppImages
        }
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: iconFile + ".png",
          section: "web",
          genericName: desktopGeneric,
          categories: desktopCategories
        }
      }
    },
    {
      name: "@electron-forge/maker-rpm",
      platforms: [],
      config: {
        options: {
          icon: iconFile + ".png",
          genericName: desktopGeneric,
          categories: desktopCategories
        }
      }
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        prerelease: (getBuildID() === "devel"),
        repository: {
          owner: packageJson.author.name,
          name: "WebCord"
        },
        draft: true
      }
    }
  ],
  hooks: {
    packageAfterCopy: async (_ForgeConfig, path) => {
      const buildConfig = {
        type: getBuildID(),
        commit: (getBuildID() === "devel") ? getCommit() : undefined,
      }
      writeFileSync(resolve(path, 'buildInfo.json'), JSON.stringify(buildConfig, null, 2))
    }
  }
};

module.exports = config;