global.ucapan = () => {
  const currentTime = moment().tz('Asia/Jakarta');
  const currentHour = currentTime.hour();
  let greeting;
  if (currentHour >= 5 && currentHour < 12) {
    greeting = 'Selamat pagi, para pendosa 😈';
  } else if (currentHour >= 12 && currentHour < 15) {
    greeting = 'Siang, para penikmat dosa 😈';
  } else if (currentHour >= 15 && currentHour < 18) {
    greeting = 'Sore, para pencari masalah 😈';
  } else {
    greeting = 'Malam, para begundal 😈';
  }
  return greeting;
}
