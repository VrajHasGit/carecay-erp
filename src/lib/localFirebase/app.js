const apps = new Map();

export function initializeApp(config, name = '[DEFAULT]') {
  const app = { config, name };
  apps.set(name, app);
  return app;
}

export function getApp(name = '[DEFAULT]') {
  const app = apps.get(name);
  if (!app) throw new Error(`No Firebase app '${name}' has been created`);
  return app;
}

export function deleteApp(app) {
  apps.delete(app.name);
  return Promise.resolve();
}
