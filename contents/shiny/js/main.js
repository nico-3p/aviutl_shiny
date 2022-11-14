let app;
const cont = new PIXI.Container();
let animationList = []
let preX, preY;
let filePath;

function init() {
    const canvas = document.getElementById("canvas");

    app = new PIXI.Application({
        view: canvas,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        transparent: true
    });

    app.stage.addChild(cont);
}
init();

function onAssetsLoaded(_, res) {
    const currentSpine = new PIXI.spine.Spine(res.model.spineData)
    cont.removeChild(cont.children[0]);
    cont.addChild(currentSpine);

    resetPos();
    setupAnimationList();

    try {
        currentSpine.skeleton.setSkinByName("normal");
    } catch (e) {
        currentSpine.skeleton.setSkinByName("default");
    }
    
    const defaultAnimation = "wait";
    currentSpine.state.setAnimation(0, defaultAnimation, false);
}

function resetPos() {
    const spineLocalBound = cont.children[0].getLocalBounds();
    cont.children[0].position.set(-spineLocalBound.x, -spineLocalBound.y);
    
    const contLocalBound = cont.getLocalBounds();

    cont.scale.set(1);
    cont.pivot.set(contLocalBound.width / 2, contLocalBound.height / 2);
    cont.position.set(app.view.width / 2, app.view.height / 2);
}


function showFileDialog() {
    const dia = document.createElement("input");
    dia.type = "file";
    dia.multiple = true;

    dia.addEventListener("change", (e) => {
        const files = e.target.files;

        console.log(files);
    },false);
    
    dia.click();
}

/**
 * すべてのアニメーションを取得
 */
function setupAnimationList() {
    animationList = cont.children[0].spineData.animations;
}

/**
 * indexを用いたアニメーション変更
 * @param {Spine} currentSpine 対象のSpine
 * @param {Number} anim アニメーションのindex
 */
function setAnimationByIndex(currentSpine, anim) {
    const now = currentSpine.state.tracks[0].animation;
    const nowIndex = animationList.indexOf(now);

    if (anim != nowIndex) {
        currentSpine.state.setAnimation(0, animationList[Math.trunc(anim)].name, true);

        currentSpine.skeleton.setToSetupPose(); 
        currentSpine.update(0);
        currentSpine.autoUpdate = true;
    }
}

/**
 * アニメーションを指定時間で描画
 * @param {Number} t 指定時間 (sec) 
 */
function setAnimTime(t) {
    // 再生開始時間と終了時間を設定し、指定時間で停止させる。 https://github.com/pixijs/spine/issues/280#issuecomment-823907182
    // あまりよろしい方法ではないらしい?
    cont.children[0].state.tracks[0].animationStart = t;
    cont.children[0].state.tracks[0].animationEnd = t;
}

// フレーム毎処理
AviUtlBrowser.registerRenderer(async params => {
    const p = JSON.parse(params.param);
    console.log(p);

    if (p.jpath != filePath) {
        filePath = p.jpath;
        app.loader.add('model', p.jpath).load(onAssetsLoaded);
    }
    
    // if(cont.children.length == 0) return;

    const duration = cont.children[0].state.tracks[0].animation.duration; // アニメーション総再生時間

    const time = duration ? ((duration * p.start / 100) + p.time * (p.rate / 100)) % duration : 0; // NOTE: durationが0だと計算結果がNaNになるため、durationが0の時は現再生時間を0にする

    // アニメーション再生時間設定
    setAnimTime(time);

    // アニメーション変更
    setAnimationByIndex(cont.children[0], p.anim);


    // スケール変更
    if (cont.scale.x != p.scale / 100) cont.scale.set(p.scale / 100);

    // 画像サイズ変更
    if (app.view.width != p.w || app.view.height != p.h) {
        app.view.width = p.w;
        app.view.height = p.h;
        resetPos(cont.children[0]);
    }

    // 座標変更
    if (p.oriXY && (preX != p.x || preY != p.y)) {
        const spineLocalBound = cont.children[0].getLocalBounds();

        if (preX != p.x) {
            cont.children[0].position.x = -spineLocalBound.x + p.x / cont.scale.x;
            preX = p.x;
        }

        if (preY != p.y) {
            cont.children[0].position.y = -spineLocalBound.y + p.y / cont.scale.y;
            preY = p.y;
        }
    }

    // 反転モード
    if (p.skinRev == 1 && cont.children[0].skeleton.skin.name == "normal") {
        try {
            cont.children[0].skeleton.setSkinByName("reverse");
        } catch (e) {
            cont.children[0].skeleton.setSkinByName("default");
        }
    }
    else if (p.skinRev == 0 && cont.children[0].skeleton.skin.name == "reverse") {
        try {
            cont.children[0].skeleton.setSkinByName("normal");
        } catch (e) {
            cont.children[0].skeleton.setSkinByName("default");
        }
    }
});

