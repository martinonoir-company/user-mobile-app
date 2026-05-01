# Splash assets

Background:     solid black (#000000)
Method:         contain-fit, lanczos3, no cropping

## iOS

Drag `ios/LaunchImage.imageset/` into your Xcode asset catalogue
(`Assets.xcassets`). The Contents.json is already wired.

## Android (bare RN)

Copy each `android/drawable-*` folder into `android/app/src/main/res/`
(merging with the existing folders). The bare `android/drawable/` is the
default fallback.

## Expo

```json
// app.json
{
  "expo": {
    "splash": {
      "image": "./assets/splash/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "android": {
      "splash": {
        "image": "./assets/splash/android12-splash-icon.png",
        "backgroundColor": "#000000"
      }
    }
  }
}
```

For `expo-splash-screen` (the SDK 50+ plugin):

```json
"plugins": [
  ["expo-splash-screen", {
    "image": "./assets/splash/splash-icon.png",
    "imageWidth": 200,
    "resizeMode": "contain",
    "backgroundColor": "#000000"
  }]
]
```
