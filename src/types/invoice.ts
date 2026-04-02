export type InvoiceItem = {
    id: string;
    item: string;
    qty: number;
    price: number;
};

export type Customer = {
    id: string;
    name: string;
};

export type DriveFile = {
    id: string;
    name: string;
    mimeType: string;
};

export const CUSTOMER_MEMORY: Record<string, Customer> = {
    "Tech Corp": { id: "CUST-001", name: "Tech Corp" },
    "Galaxy Inc": { id: "CUST-002", name: "Galaxy Inc" },
};
