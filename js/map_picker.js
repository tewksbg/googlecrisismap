// Copyright 2012 Google Inc.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License.  You may obtain a copy
// of the License at: http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distrib-
// uted under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, either express or implied.  See the License for
// specific language governing permissions and limitations under the License.

/**
 * @fileoverview A dropdown menu of links to other maps.
 */
goog.provide('cm.MapPicker');

goog.require('cm');
goog.require('cm.events');
goog.require('cm.ui');
goog.require('goog.array');
goog.require('goog.dom.classes');

/**
 * A dropdown triangle that reveals a menu of links to other maps.
 * @param {Element} parentElem The element in which to display the arrow.
 *     The menu will appear when the arrow is clicked.
 * @param {Array} menuItems An array of items, where each item has the keys:
 *     title: The title to display in the menu.
 *     url: The URL to navigate to when the item is clicked.
 * @constructor
 */
cm.MapPicker = function(parentElem, menuItems) {
  var menuElem = cm.MapPicker.createMenu_(menuItems);
  cm.MapPicker.createMenuButton_(parentElem, menuElem);
};

/**
 * Constructs the menu of maps.
 * @param {Array} menuItems An array of items, where each item has the keys:
 *     title: The title to display in the menu.
 *     url: The URL to navigate to when the item is clicked.
 * @return {Element} The menu's top-level element.
 * @private
 */
cm.MapPicker.createMenu_ = function(menuItems) {
  var currentUrl = new goog.Uri(window.location);
  currentUrl.setQuery('');
  currentUrl.setFragment('');
  return cm.ui.create('ul', {'class': 'cm-popup cm-map-picker'},
                      goog.array.map(menuItems, function(item) {
    // TODO(kpy): Log Analytics events to track clicks on these menu items.
    // Requires further investigation.  Since setting window.location will
    // abort in-flight requests, we can't just call cm.Analytics.logEvent and
    // immediately set window.location.  Many possible solutions are debated in
    // forums; insanely, Google's official advice is to add an arbitrary delay:
    // http://support.google.com/googleanalytics/bin/answer.py?answer=1136920
    var destinationUrl = currentUrl.resolve(new goog.Uri(item.url));
    var selected = (destinationUrl.toString() === currentUrl.toString());
    return cm.ui.create(
        'li', selected ? {'class': 'cm-selected'} : {},
        cm.ui.createLink(item.title, selected ? null : item.url));
  }));
};

/**
 * Aligns the top-left or top-right corner of the menu with the menu button.
 * @param {Element} menu The menu element to position.
 * @param {Element} button The menu button with which to align the menu.
 * @private
 */
cm.MapPicker.positionMenu_ = function(menu, button) {
  var menuWidth = cm.ui.offscreenSize(menu, cm.ui.document.body).width;
  var buttonPos = goog.style.getPageOffset(button);
  var buttonSize = goog.style.getSize(button);
  var bodySize = goog.style.getSize(cm.ui.document.body);
  // If the menu fits on the left (right edge aligned with button), put it
  // there; otherwise put it on the right (left edge aligned with button).
  // The latter case happens when, for example, the panel is on the left and
  // there is a menu item with a long title.
  var menuOnLeftX = buttonPos.x + buttonSize.width - menuWidth;
  menu.style.left = (menuOnLeftX > 0 ? menuOnLeftX : buttonPos.x) + 'px';
  menu.style.top = (buttonPos.y + buttonSize.height) + 'px';
};

/**
 * Creates the dropdown button with listeners to open the menu when clicked.
 * @param {Element} parentElem The parent element in which to create the button.
 * @param {Element} menuElem The menu to show when the button is clicked.
 * @private
 */
cm.MapPicker.createMenuButton_ = function(parentElem, menuElem) {
  var buttonElem = cm.ui.create('div', {'class': 'cm-map-picker-button'});
  cm.ui.append(parentElem, buttonElem);

  var menuShown = false;
  function showMenu(show) {
    if (show) {
      cm.MapPicker.positionMenu_(menuElem, buttonElem);
      cm.ui.append(cm.ui.document.body, menuElem);
    } else {
      cm.ui.remove(menuElem);
    }
    menuShown = show;
  }

  cm.events.listen(cm.ui.document.body, 'click', function(e) {
    // If the user clicks on the button, we toggle whether the menu is showing.
    // If the user clicks anywhere else, we hide the menu.
    showMenu((e.target == buttonElem) ? !menuShown : false);
  });
  // If things move around, just hide the menu (don't bother to reposition it).
  // Collapsing the cm.PanelView emits 'resize' on the window, so this happens
  // on panel expand/collapse as well as manual resizing of the browser window.
  cm.events.listen(goog.global, 'resize', function(e) { showMenu(false); });
};