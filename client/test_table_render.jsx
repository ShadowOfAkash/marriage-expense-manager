import React from 'react';
import { renderToString } from 'react-dom/server';
import { Table } from '@heroui/react';

function TestTable() {
  const rows = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
  return (
    <Table aria-label="Table">
      <Table.Header>
        <Table.Column>NAME</Table.Column>
      </Table.Header>
      <Table.Body items={rows}>
        {(item) => (
          <Table.Row key={item.id}>
            <Table.Cell>{item.name}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}

try {
  renderToString(<TestTable />);
  console.log("SUCCESS!");
} catch (e) {
  console.log("FAILED:", e.message);
}
