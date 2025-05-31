# software-final
crazy horse

5/28實作簡單map1，嘗試加入角色。

A向左 D向右 Space跳躍 左shift可以取消/開啟下方道具欄

5/29 3:30目前左鍵可以放置box，位置看似正確，但只要打開F12位置就會偏掉，原因不明。

5/29 15:30 目前螢幕縮放比例要開80%才會是對的，按shift後，使用滑鼠滾輪可以選擇要的道具
box(土色)可以放在任何地點，最多放三個，按右鍵全部清除
<<<<<<< HEAD
weight(灰色)只能放在高的地方，大約畫面上方1/5，被砸到會死掉，但一定只能從上方砸到會死掉，冷卻3秒，待在地圖4秒消失
=======
weight(灰色)只能放在高的地方，大約畫面上方1/5，被砸到會死掉，但一定只能從上方砸到會死掉，冷卻3秒，待在地圖4秒消失

5/31 3:17 setting scene完成，可調整BGM SFX音量和選擇角色，角色有三個屬性:跳躍高度/速度/血量

5/31 05:00 add this before build index.html
<!DOCTYPE html>
<html>
<head>
    </head>
<body>
    <script src="src/assets/scripts/libs/firebase/firebase-app.js"></script>
    <script src="src/assets/scripts/libs/firebase/firebase-database.js"></script>
    <script src="src/assets/scripts/libs/firebase/firebase-auth.js"></script> <script src="src/settings.js" charset="utf-8"></script>
    <script src="main.js" charset="utf-8"></script>

    </body>
</html>

5/31 23:40 讓至少操作的player1可以使用道具
>>>>>>> 83de82d (單人模式可以放道具)
