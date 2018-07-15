var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

var table = new Table({
    head: ['Item ID', 'Product Name', 'Price', 'Quantity'],
    colWidths: [15, 45, 20, 20]
});

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password:"",
    database: "bamazon"
});

connection.connect((err) => {
    if(err)
    {
        throw err;
    }
    console.log("connected as id " + connection.threadId);
    doShopping();
});



function doShopping()
{
    connection.query('SELECT item_id, product_name, price, stock_quantity FROM products', (err, res) => {

        //console.log(res);
        for(var i = 0; i < res.length; i++)
        {
            table.push([res[i].item_id, res[i].product_name, res[i].price.toFixed(2), res[i].stock_quantity]);
        }

        console.log(table.toString());

        inquirer.prompt([{
            name: "itemid",
            type: "input",
            message: "What would you like to buy?(Please enter item id from the above table).",
            validate: (value) =>{
                if(isNaN(value) == false)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
        },
    {
      name: "quantity",
      type: "input",
      message: "How many would you like to buy?" ,
      validate: (value) =>{
            if(isNaN(value) == false)
            {
                return true;
            }
            else
            {
                return false;
            }
        } 
    }]).then((answer) => {

        for(var i = 0; i < res.length; i++)
        {
            if(res[i].item_id == answer.itemid)
            {
                var chosenItem = res[i];
            }
        }

        var updateStock = parseInt(chosenItem.stock_quantity) - parseInt(answer.quantity);
        var productsales = parseFloat(chosenItem.product_sales).toFixed(2);
        //console.log(productsales);
        if(chosenItem.stock_quantity < parseInt(answer.quantity))
        {
            console.log("Insufficient quantity!");
            furthershopping();
        }
        else
        {

            var total = (parseFloat(answer.quantity) * chosenItem.price).toFixed(2);
            var productTotal = (parseFloat(total) + parseFloat(productsales)).toFixed(2);
            //console.log(productTotal);
            //query to update the stocks 
            var query = connection.query("UPDATE products SET ?, ? WHERE ?",
        [
            {
                stock_quantity: updateStock
            },
            {
                product_sales: productTotal
            },
            {
                item_id: chosenItem.item_id
            }
        ],
        (err, res) => 
        {
            if(err)
            {
                throw err;
            }
            console.log("Successfully Purchased");
            console.log(`Your Total is $ ${total}`);
            furthershopping();
        });
        }
    });
    });
}

//Provide an Exit choice to user
function furthershopping()
{
    inquirer.prompt({
       name: "purchaseagain",
       type: "list",
       choices: ["yes", "no"],
       message: "Would you like to purchase again or another item?" 
    }).then((answer) => {
        if(answer.purchaseagain == "yes")
        {
            doShopping();
        }
        else
        {
            console.log("Than you for Shopping! Hope to See you Again");
            connection.end();
        }
    });
}