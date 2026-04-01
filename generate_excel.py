import pandas as pd
import pathlib

def pmt(rate, nper, pv):
    if rate == 0: return pv / nper
    if nper == 0: return 0
    pvif = (1 + rate) ** nper
    return (rate * pv * pvif) / (pvif - 1)

# Global Variables
sell_rate = 0.06
curr_value = 720000
curr_bal = 232950
net_proceeds = curr_value * (1 - sell_rate) - curr_bal

town_price = 550000
town_loan = max(0, town_price - net_proceeds)
town_rate = 0.0548
town_term = 15 * 12
town_pmt = pmt(town_rate / 12, town_term, town_loan)

curr_monthly_total = 2086 + 800 + 200 + 1500 + 50 + 100 + 60 + 30 + 100
town_monthly_total = town_pmt + 350 + 80 + 300 + 40 + 80 + 50 + 0 + 100
rent_monthly_total = 2700 + 20 + 30 + 60 + 0 + 0 + 100

global_data = [
    ("Global Assumptions", ""),
    ("Selling Costs (%)", 6.0),
    ("Annual Home Apprec. (%)", 3.0),
    ("Annual Inv. Return (%)", 6.0),
    ("", ""),
]

current_data = [
    ("Home Details", ""),
    ("Current Value ($)", 720000),
    ("Remaining Mortgage ($)", 232950),
    ("Interest Rate (%)", 1.75),
    ("Current P&I ($)", 2086),
    ("", ""),
    ("Monthly Costs", ""),
    ("Taxes ($)", 800),
    ("Insurance ($)", 200),
    ("Maintenance Save ($)", 1500),
    ("", ""),
    ("Utilities", ""),
    ("Gas", 50),
    ("Electric", 100),
    ("Water", 60),
    ("Trash", 30),
    ("Internet", 100),
    ("", ""),
    ("Total Monthly Expense ($)", round(curr_monthly_total, 2)),
]

townhome_data = [
    ("Purchase Details", ""),
    ("Asking Price ($)", 550000),
    ("Est. Down Payment ($)", round(net_proceeds, 2)),
    ("Est. Loan Amount ($)", round(town_loan, 2)),
    ("New Loan Rate (%)", 5.48),
    ("New Term (Yrs)", 15),
    ("Financing Strategy", "Option A: 15-Year Mortgage"),
    ("Estimated P&I ($)", round(town_pmt, 2)),
    ("", ""),
    ("Monthly Costs", ""),
    ("New Taxes ($)", 350),
    ("New Insurance ($)", 80),
    ("HOA Fee ($)", 300),
    ("", ""),
    ("Utilities", ""),
    ("Gas", 40),
    ("Electric", 80),
    ("Water", 50),
    ("Trash", 0),
    ("Internet", 100),
    ("", ""),
    ("Total Monthly Expense ($)", round(town_monthly_total, 2)),
]

rent_data = [
    ("Rental Details", ""),
    ("Monthly Rent ($)", 2700),
    ("Renter's Ins ($)", 20),
    ("", ""),
    ("Utilities", ""),
    ("Gas", 30),
    ("Electric", 60),
    ("Water", 0),
    ("Trash", 0),
    ("Internet", 100),
    ("", ""),
    ("Total Monthly Expense ($)", round(rent_monthly_total, 2)),
]

summary_data = [("--- GLOBAL ASSUMPTIONS ---", "")] + global_data[1:] + \
               [("--- CURRENT PROPERTY ---", "")] + current_data + \
               [("--- 55+ TOWNHOME ---", "")] + townhome_data + \
               [("--- RENT & INVEST ---", "")] + rent_data

def format_tab(data_list):
    return pd.DataFrame(data_list, columns=["Item", "Value"])

df_current = format_tab(current_data)
df_townhome = format_tab(townhome_data)
df_rent = format_tab(rent_data)
df_summary = format_tab(summary_data)

output_path = pathlib.Path("G:/My Drive/Property_Comparison.xlsx")

# Format output file
with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
    df_current.to_excel(writer, sheet_name='Current Property', index=False)
    df_townhome.to_excel(writer, sheet_name='55+ Townhome', index=False)
    df_rent.to_excel(writer, sheet_name='Rent & Invest', index=False)
    df_summary.to_excel(writer, sheet_name='Summary', index=False)
    
    # Auto-adjust column widths for better readability
    for sheet_name in writer.sheets:
        worksheet = writer.sheets[sheet_name]
        for col in worksheet.columns:
            max_length = 0
            column_letter = col[0].column_letter
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2)
            worksheet.column_dimensions[column_letter].width = adjusted_width

print(f"Spreadsheet saved to: {output_path}")
