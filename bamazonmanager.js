var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

var table = new Table({
    head: ['Item ID', 'Product', 'Department', 'Price', 'Quantity'],
    colWidths: [15, 35, 35, 20, 20]
});

var tabledepartment = new Table({
    head: ['Department ID', 'Department Name'],
    colWidths: [20,50]
})

var dept = [];
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
});

connection.query("SELECT department_id, department_name FROM departments", (err, res) => {
        if(err)
        {
            throw err;
        }
        for(var i = 0;  i < res.length; i++)
        {
            tabledepartment.push([res[i].department_id, res[i].department_name]);
        }
        console.log(tabledepartment.toString());
    });
storeManager();

function storeManager()
{

    inquirer.prompt([{
        name: "menu",
        type: "list",
        message: "Welcome! What would you like to do?",
        choices: [
            "View Products for Sale",
            "View Low Inventory",
            "Add to Inventory",
            "Add New Product"
        ]
    }]).then((res) => {

        switch(res.menu)
        {
            case "View Products for Sale":
               viewProductSale();
               break;
            case "View Low Inventory":
                viewInventory();
                break;
            case "Add to Inventory":
                addInventory();
                break;
            case "Add New Product":
                addProduct();
                break;
        }
    });
}

function viewProductSale()
{
   connection.query('SELECT products.item_id, products.product_name, departments.department_name, products.price, products.stock_quantity FROM products JOIN departments ON departments.department_id = products.department_id ORDER BY item_id', 
   (err, res) => {
       if(err)
       {
           throw err;
       }

       for(var i = 0; i < res.length; i++)
       {
           table.push([res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]);
       }

       console.log(table.toString());
       manageFurther();
   });

}

function viewInventory()
{
    connection.query('SELECT products.item_id, products.product_name, departments.department_name, products.price, products.stock_quantity FROM products JOIN departments ON departments.department_id = products.department_id WHERE stock_quantity < 5 ORDER BY item_id', 
   (err, res) => {
       if(err)
       {
           throw err;
       }
       for(var i = 0; i < res.length; i++)
       {
           table.push([res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]);
       }

       console.log(table.toString());
       manageFurther();
   });
}

function addInventory()
{
    inquirer.prompt([{
        name: "itemid",
        type:"input",
        message:"Enter Product Id to update the Inventory?",
        validate: (value) => {
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
       name: "update_stock",
       type: "input",
       message: "Enter amount that you need to update in stock of selected item?",
       validate: (value) => {
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
        console.log("Quantity: " + answer.update_stock + " of PRoduct ID: " + answer.itemid);

        connection.query("UPDATE products SET ? WHERE ?",
        [
            {
                stock_quantity: answer.update_stock
            },
            {
                item_id: answer.itemid
            }
        ]
        );
        console.log("Inventory Updated Successfully");
        manageFurther();
    });
}

function addProduct()
{
    connection.query("SELECT department_id FROM departments", (err,res) => {
      if(err)
      {
          throw err;
      }  
      for(var i = 0; i < res.length; i++)
      {
          dept.push(res[i].department_id);
      }
      connection.close;
    })

    inquirer.prompt([
        {
            name: "product",
            type:"input",
            message: "Enter name of the product to add: ",
            validate: (value) => {
                if(value == null || value == "")
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }
        },
        {
            name: "department",
            type:"list",
            choices: dept,
            message: "Select department ID for the item."
        },
        {
            name: "price",
            type: "input",
            message: "Enter appropriate price for a new product",
            validate: (value) => {
                if(value == null || value == "")
                {
                    return false;
                }
                else if(isNaN(value) == true)
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }
        },
        {
            name: "quantity",
            type: "input",
            message:"Enter quantity of product to put in stock",
            validate: (value) => {
                if(value == null || value == "")
                {
                    return false;
                }
                else if(isNaN(value) == true)
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }
        },
        {
            name: "sales",
            type: "input",
            message:"Enter the amount of product sales",
            validate: (value) => {
                if(value == null || value == "")
                {
                    return false;
                }
                else if(isNaN(value) == true)
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }
        }
    ]).then((answer) => {
        var query = connection.query("INSERT INTO products SET ?",
            {
                product_name: answer.product,
                department_id: answer.department,
                price: answer.price,
                stock_quantity: answer.quantity,
                product_sales: answer.sales
            },
            (err, res) => {
                if(err)
                {
                    throw err;
                }
                console.log(res.affectedRows + "New Row Affected. PRoduct Inserted Successfully");
                connection.end;
                manageFurther();
            }
        )
    });
}

function manageFurther()
{
    inquirer.prompt({
        name:"manage",
        type: "list",
        choices: ["yes", "no"],
        message: "Would you like to continue to store managing?"
    }).then((answer) => {
        if(answer.manage == "yes")
        {
            storeManager();
        }
        else
        {
            console.log("Thank you! Bye Bye");
            connection.end();
        }
    });
}