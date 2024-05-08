const fs = require('fs');
const csv = require('csv-parser');

const resultAddresses = new Set();
const fulfAddresses = [];

// Read AVC AddressInfoResults491 file
fs.createReadStream('AVCAddressInfoResults491.csv')
  .pipe(csv())
  .on('data', (row) => {
    resultAddresses.add(row['Addressee']);
  })
  .on('end', () => {
    // Read Amazon_North_America_Fulfillment_Center_Address_List file
    fs.createReadStream(
      'Amazon_North_America_Fulfillment_Center_Address_List.csv'
    )
      .pipe(csv())
      .on('data', (row) => {
        fulfAddresses.push(row);
      })
      .on('end', () => {
        // Find addresses in fulfAddresses that are not in resultAddresses
        const deltaAddresses = fulfAddresses.filter(
          (address) => !resultAddresses.has(address['Amazon Identifier'])
        );

        // Prepare the CSV data
        const header = Object.keys(fulfAddresses[0]).join(',');
        const data = deltaAddresses
          .map((row) => Object.values(row).join(','))
          .join('\n');

        // Write deltaAddresses to a new CSV file
        fs.writeFileSync('deltaAddresses.csv', `${header}\n${data}`);

        console.log('Delta addresses saved to deltaAddresses.csv');
      });
  });
