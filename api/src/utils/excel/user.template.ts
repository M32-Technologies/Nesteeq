import ExcelJs from "exceljs"


export const generateResidentExcelTemplate = async () => {

    const workbook = new ExcelJs.Workbook();

    const workSheet = workbook.addWorksheet("Residents");

    workSheet.columns = [
        {
            header: "Full Name",
            key: "fullName",
            width: 28,
        },
        {
            header: "Email",
            key: "email",
            width: 32,
        },
        {
            header: "Phone Number",
            key: "phoneNumber",
            width: 20,
        },
        {
            header: "Block",
            key: "block",
            width: 15,
        },
        {
            header: "Flat Number",
            key: "flatNumber",
            width: 18,
        },
        {
            header: "Role",
            key: "role",
            width: 18,
        },
    ]

    const headerRow = workSheet.getRow(1)

    headerRow.height = 24

    headerRow.font = {
        bold: true,
    }

    headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
    }

    headerRow.eachCell((cell) => {
        cell.border = {
            top: {
                style: "thin",
            },
            left: {
                style: "thin",
            },
            bottom: {
                style: "thin",
            },
            right: {
                style: "thin",
            },
        }
    })

    for (let row = 2; row <= 500; row++) {
        workSheet.getCell(`F${row}`).dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: ['"owner,resident"'],
            showErrorMessage: true,
            errorTitle: "Invalid Role",
            error: "Role must be either owner or resident.",
        }
    }
    const instructions = workbook.addWorksheet("Instructions")
    instructions.columns = [
        {
            key: "instruction",
            width: 80,
        },
    ]

    instructions.addRows([
        {
            instruction: "Nesteeq Resident Bulk Invitation Template",
        },
        {
            instruction:
                "Use this template only for adding apartment Owners and Tenants.",
        },
        {
            instruction: "",
        },
        {
            instruction: "Required fields:",
        },
        {
            instruction: "• Full Name",
        },
        {
            instruction: "• Email",
        },
        {
            instruction: "• Block",
        },
        {
            instruction: "• Flat Number",
        },
        {
            instruction: "• Role",
        },
        {
            instruction: "",
        },
        {
            instruction: "Role must be either owner or tenant.",
        },
        {
            instruction:
                "Block and Flat Number must already exist in the apartment.",
        },
        {
            instruction:
                "Do not modify the column names in the Residents worksheet.",
        },
        {
            instruction:
                "Do not add staff roles such as facility_manager, security_staff, or maintenance_technician.",
        },
    ])

    instructions.getRow(1).font = {
        bold: true,
        size: 14,
    }

    return workbook
}


