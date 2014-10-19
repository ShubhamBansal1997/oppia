// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

/**
 * @fileoverview End-to-end tests of embedding explorations in other websites.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var general = require('../protractor_utils/general.js')
var users = require('../protractor_utils/users.js');
var admin = require('../protractor_utils/admin.js');
var player = require('../protractor_utils/player.js');

describe('Embedding', function() {
  it('should display and play embedded explorations', function() {
    var TEST_PAGES = [
      'embedding_tests_dev_0.0.1.html', 
      'embedding_tests_dev_0.0.1.min.html',
      'embedding_tests_jsdelivr_0.0.1.min.html'];
    // The length of time the page waits before confirming an exploration
    // cannot be loaded.
    var LOADING_TIMEOUT = 10000;

    var playCountingExploration = function() {
      general.waitForSystem();
      protractor.getInstance().waitForAngular();

      expect(player.getCurrentQuestionText()).toBe(
        'Suppose you were given three balls: one red, one blue, and one ' + 
        'yellow. How many ways are there to arrange them in a straight line?');
      player.submitAnswer('NumericInput', 6);
      expect(player.getCurrentQuestionText()).toBe(
        'Right! Why do you think it is 6?');
      player.expectExplorationToNotBeOver();
      player.submitAnswer('TextInput', 'factorial');
      player.expectExplorationToBeOver();
    };

    users.login('embedder@example.com', true);
    admin.reloadExploration('counting');

    for (var i = 0; i < TEST_PAGES.length; i++) {

      // This is necessary as the pages are non-angular; we need xpaths below
      // for the same reason.
      var driver = protractor.getInstance().driver;
      driver.get(general.SERVER_URL_PREFIX + '/scripts/' + TEST_PAGES[i]);

      // Test of standard loading
      protractor.getInstance().switchTo().frame(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-standard']/iframe")));
      playCountingExploration();
      browser.switchTo().defaultContent();

      // Test of deferred loading
      driver.findElement(
        by.xpath(
          "//div[@class='protractor-test-deferred']/oppia/div/button")).click();
      protractor.getInstance().switchTo().frame(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-deferred']/iframe")));
      playCountingExploration();
      browser.switchTo().defaultContent();

      // Tests of failed loading
      expect(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-missing-id']/div/span")
        ).getText()).toMatch(
          'This Oppia exploration could not be loaded because no oppia-id ' + 
          'attribute was specified in the HTML tag.');
      driver.findElement(
        by.xpath(
          "//div[@class='protractor-test-invalid-id-deferred']/oppia/div/button"
        )).click();
      protractor.getInstance().sleep(LOADING_TIMEOUT);
      expect(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-invalid-id']/div/div/span")
        ).getText()).toMatch('This exploration could not be loaded.');
      expect(
        driver.findElement(
          by.xpath("//div[@class='protractor-test-invalid-id']/div/div/span")
        ).getText()).toMatch('This exploration could not be loaded.');
    }
  });
});