
const Page = require("./helpers/page");

let pageProxy;

beforeEach(async () => {
  pageProxy = await Page.build();

  await pageProxy.goto("http://localhost:3000");
});

afterEach(async () => {
  await pageProxy.close();
});

test("Ensure that header has correct text", async () => {
  const text = await pageProxy.$eval("a.brand-logo", el => el.innerText);

  expect(text).toEqual("Blogster");
});

test("clicking login starts oauth flow", async () => {
  await pageProxy.click(`a[href='/auth/google']`);

  const url = await pageProxy.url();

  expect(url).toMatch("/accounts.google.com/");
});

test("when signed in, shows logout button", async () => {
  await pageProxy.login();

  const text = await pageProxy.$eval(
    'a[href="/auth/logout"]',
    el => el.innerText
  );

  expect(text).toEqual("Logout");
});
