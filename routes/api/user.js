const uploadDirs = [
  path.join(__dirname, '../../../client/public/uploads'),
  path.join(__dirname, '../../../client/public/uploads/profile'),
  path.join(__dirname, '../../../client/public/uploads/background'),
  path.join(__dirname, '../../../client/public/uploads/highlights')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}); 