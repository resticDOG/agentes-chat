/**
 * Expo config plugin: trust user-installed CA certificates (e.g. mkcert / private LAN CA) on Android release builds.
 * Writes `res/xml/network_security_config.xml` and sets `android:networkSecurityConfig` on `<application>`.
 */
const fs = require("node:fs");
const path = require("node:path");
const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

module.exports = (config) => {
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) throw new Error("with-user-certs: no <application> element in AndroidManifest.xml");
    app.$ = app.$ ?? {};
    app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return cfg;
  });

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const xmlDir = path.join(cfg.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, "network_security_config.xml"), NETWORK_SECURITY_CONFIG, "utf8");
      return cfg;
    },
  ]);

  return config;
};
