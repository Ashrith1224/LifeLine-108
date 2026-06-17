const isd = require('india-state-district');
console.log(Object.keys(isd));
if (isd.getAllStates) console.log(isd.getAllStates().slice(0, 2));
if (isd.getDistrictsByState) console.log(isd.getDistrictsByState('Maharashtra').slice(0, 2));
