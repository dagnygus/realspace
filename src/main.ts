import { NgZone } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// import { AppModule } from './app/app.module';

NgZone.assertInAngularZone = function() {};

setTimeout(() => {
  bootstrapApplication(AppComponent, appConfig)
}, 0);
