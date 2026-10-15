const later = (run) => setTimeout(run, 0);

function storeOf(data, name, writable) {
  const store = data.stores.get(name);
  if (!store) throw new Error(`No store ${name}`);
  const request = (run) => {
    const item = { result: undefined, error: null, onsuccess: null, onerror: null };
    later(() => {
      try {
        item.result = run();
        item.onsuccess?.({ target: item });
      } catch (error) {
        item.error = error;
        item.onerror?.({ target: item });
      }
    });
    return item;
  };
  const write = (run) => {
    if (!writable) throw new Error('This transaction is read-only');
    return request(run);
  };
  return {
    get: (id) => request(() => (store.rows.has(id) ? structuredClone(store.rows.get(id)) : undefined)),
    getAll: () => request(() => [...store.rows.values()].map((row) => structuredClone(row))),
    put: (value) => write(() => {
      store.rows.set(value[store.keyPath], structuredClone(value));
      return value[store.keyPath];
    }),
    delete: (id) => write(() => {
      store.rows.delete(id);
    }),
    clear: () => write(() => {
      store.rows.clear();
    }),
  };
}

function databaseOf(data) {
  return {
    objectStoreNames: { contains: (name) => data.stores.has(name) },
    createObjectStore(name, { keyPath }) {
      data.stores.set(name, { keyPath, rows: new Map() });
    },
    transaction(names, mode = 'readonly') {
      const allowed = [].concat(names);
      const transaction = {
        error: null,
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore(name) {
          if (!allowed.includes(name)) throw new Error(`${name} is not in this transaction`);
          return storeOf(data, name, mode === 'readwrite');
        },
      };
      later(() => later(() => transaction.oncomplete?.()));
      return transaction;
    },
    close() {},
  };
}

export function fakeIndexedDB() {
  const databases = new Map();
  return {
    databases,
    open(name, version = 1) {
      const request = { result: null, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
      later(() => {
        if (!databases.has(name)) databases.set(name, { version: 0, stores: new Map() });
        const data = databases.get(name);
        request.result = databaseOf(data);
        if (version > data.version) {
          data.version = version;
          request.onupgradeneeded?.({ target: request });
        }
        request.onsuccess?.({ target: request });
      });
      return request;
    },
  };
}
