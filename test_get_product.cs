using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Coflnet.Ane.Api;
using Coflnet.Ane;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System.IO;

class Program
{
    static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Development",
            ContentRootPath = "/run/media/ekwav/Data4/dev/ebay/AneApi"
        });
        builder.Configuration.SetBasePath("/run/media/ekwav/Data4/dev/ebay/AneApi");
        builder.Configuration.AddJsonFile("appsettings.json");
        builder.Configuration.AddJsonFile("appsettings.Development.json");
        builder.Services.AddAneCore(builder.Configuration);
        builder.Services.AddAneApi(builder.Configuration);
        var app = builder.Build();

        var productService = app.Services.GetRequiredService<Coflnet.Ane.Products.ProductService>();
        var controller = new Coflnet.Ane.Products.ProductController(productService, app.Services.GetRequiredService<Microsoft.Extensions.Logging.ILogger<Coflnet.Ane.Products.ProductController>>(), app.Services.GetRequiredService<Coflnet.Ane.EnhanceApi>());

        var result = await controller.SearchProducts(
            query: "iphone",
            attributes: new System.Collections.Generic.List<string> { "color:Black", "storage:256GB" },
            zip: "94556",
            maxDistanceKm: 70
        );
        Console.WriteLine(((Microsoft.AspNetCore.Mvc.OkObjectResult)result.Result).Value);
    }
}
