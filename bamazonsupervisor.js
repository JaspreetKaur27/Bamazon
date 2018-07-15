var mysql = require('mysql');
var inquirer = require('inquirer');
var Table = require('cli-table');
var table = new Table({
    head: ['Department ID', 'Deptment Name', 'Over Head Costs', 'Product Sales', 'Total Profit'],
    colWidths: [20, 40, 15, 15, 15]
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
    supervisorView();
});

function supervisorView()
{
    inquirer.prompt([{
        name: "menu",
        type: "list",
        choices:[
            "View Product Sales by Department",
            "Create New Department"
        ],
        message: "What would you like to do?"
    }]).then((answer) => {

        switch(answer.menu)
        {
            case "View Product Sales by Department":
                viewProductByDepartment();
                break;
            case "Create New Department":
                createDepartment();
                break;
        }
    });
}

function viewProductByDepartment()
{
    sqlquery = "Select d.department_id, d.department_name, d.over_head_costs, sum(p.product_sales) as Total_Sales_By_Dept,"
    sqlquery += "sum(p.product_sales) - d.over_head_costs as Profit from products p, departments d "
    sqlquery += "where p.department_id = d.department_id Group by d.department_id Order by d.department_id";

    connection.query(sqlquery, (err,res) => {
        if(err)
        {
            throw err;
        }

        for(var i = 0; i < res.length; i++)
        {
            table.push([res[i].department_id, res[i].department_name, res[i].over_head_costs, res[i].Total_Sales_By_Dept, res[i].Profit])
        }

        console.log(table.toString());
        connection.close;
        manageFurther();
    });
}

function createDepartment()
{
    inquirer.prompt([{
        name:"department",
        type:"input",
        message: "Enter the name of the department to add.",
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
            name: "overcost",
            type: "input",
            message: "Enter over head cost.",
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
            connection.query("INSERT INTO departments SET ?",
            {
                department_name: answer.department,
                over_head_costs: answer.overcost
            },
            (err, res) => {
                if(err)
                {
                    throw err;
                }

                console.log(res.affectedRows + "New Row Affected. Department Inserted Successfully");
                manageFurther();
            })
        });
}

function manageFurther()
{
    inquirer.prompt({
        name:"manage",
        type: "list",
        choices: ["yes", "no"],
        message: "Would you like to continue to managing the store?"
    }).then((answer) => {
        if(answer.manage == "yes")
        {
            supervisorView();
        }
        else
        {
            console.log("Thank you! Bye Bye");
            connection.end();
        }
    });
}