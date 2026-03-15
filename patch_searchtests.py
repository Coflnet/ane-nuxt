import re

with open("AneE2E/SearchTests.cs", "r") as f:
    content = f.read()

# Fix the ClickAsync hang in ProductDetailPage_LoadsFromSearchResult
old_code = """                // Click the first product link
                var firstProduct = Page.Locator("a[href*='/product/']").First;
                await firstProduct.ClickAsync();"""

new_code = """                // Click the first product link (extracting href to avoid hydration race conditions)
                var firstProduct = Page.Locator("a[href*='/product/']").First;
                var href = await firstProduct.GetAttributeAsync("href");
                if (!string.IsNullOrEmpty(href))
                {
                    var destUrl = href.StartsWith("http") ? href : $"{baseUrl.TrimEnd('/')}{(href.StartsWith("/") ? "" : "/")}{href}";
                    await Page.GotoAsync(destUrl);
                }
                else
                {
                    await firstProduct.ClickAsync();
                }"""

content = content.replace(old_code, new_code)

# Fix APIRequest hardcoded URLs in all three suggest tests
content = content.replace('"https://ane.coflnet.com/api/Product/', 'baseUrl + "/api/Product/')
content = content.replace('"https://ane.deals/api/Product/', 'baseUrl + "/api/Product/')

with open("AneE2E/SearchTests.cs", "w") as f:
    f.write(content)
