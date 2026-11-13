// Đóng gói trang thành 1 file chạy được không cần mạng:
// mọi <script src="..."> trỏ tới file trong src/ được chép thẳng vào trang.
// Sửa trang thì sửa trong src/, rồi chạy:  node build.js
const fs=require("fs"),path=require("path");
const SRC=path.join(__dirname,"src");
for(const f of ["index.html","mot-lop.html"]){
  let html=fs.readFileSync(path.join(SRC,f),"utf8");
  html=html.replace(/<script src="([^"]+)"><\/script>/g,(m,src)=>{
    if(/^https?:/.test(src))return m;
    const code=fs.readFileSync(path.join(SRC,src),"utf8").replace(/<\/script/gi,"<\/script");
    return `<script>/* ${src} */\n${code}\n</script>`;
  });
  fs.writeFileSync(path.join(__dirname,f),html);
  console.log(f,(html.length/1024).toFixed(0)+" KB");
}
