const calculateDistance = (loc1,loc2)=>{
    const toRad = (value) => (value*Math.PI)/180;
    const R = 6371;

    const dLat = toRad(loc2.lat-loc1.lat);
    const dLon = toRad(loc2.lng-loc1.lng);
    const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.lat)) *
    Math.cos(toRad(loc2.lat)) *
    Math.sin(dLon / 2) ** 2;

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c; // Distance in km

};
module.exports = {calculateDistance}