process.env.JWT_SECRET = 'test-secret';

jest.mock("../src/db", () => ({ query: jest.fn(), pool: { on: jest.fn() } }));

function getHandler(method, path) {
  const router = require("../src/routes/anuncios");
  const layer = router.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method],
  );
  return layer?.route?.stack?.at(-1)?.handle;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /anuncios", () => {
  test("rechaza anuncio sin título", async () => {
    const handler = getHandler("post", "/");
    const req = { body: { mensaje: "Contenido", tipo: "info" } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Título y mensaje son obligatorios" });
  });
});
