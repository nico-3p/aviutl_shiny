let app;
const cont = new PIXI.Container();
let animationList = []

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


function onAssetsLoaded(_, res) {
    const currentSpine = new PIXI.spine.Spine(res.model.spineData)
    cont.removeChild(cont.children[0]);
    cont.addChild(currentSpine);

    const spineLocalBound = currentSpine.getLocalBounds();
    currentSpine.position.set(-spineLocalBound.x, -spineLocalBound.y);

    
    const contLocalBound = cont.getLocalBounds();

    cont.scale.set(1);
    cont.pivot.set(contLocalBound.width / 2, contLocalBound.height / 2);
    cont.position.set(app.view.width / 2, app.view.height / 2);


    setupAnimationList();

    const defaultAnimation = "wait";
    currentSpine.state.setAnimation(0, defaultAnimation, false);
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
 * @param {*} anim アニメーションのindex
 */
function setAnimationByIndex(currentSpine, anim) {
    const now = currentSpine.state.tracks[0].animation;
    const nowIndex = animationList.indexOf(now);

    if (anim != nowIndex) {
        currentSpine.state.setAnimation(0, animationList[anim].name, true);

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
    const duration = cont.children[0].state.tracks[0].animation.duration; // アニメーション総再生時間

    const time = duration ? ((duration * p.start / 100) + p.time * (p.rate / 100)) % duration : 0; // NOTE: durationが0だと計算結果がNaNになるため、durationが0の時は現再生時間を0にする

    // アニメーション再生時間設定
    setAnimTime(time);

    // アニメーション変更
    setAnimationByIndex(cont.children[0], p.anim);
});

init();
app.loader.add('model', 'model/data.json').load(onAssetsLoaded);