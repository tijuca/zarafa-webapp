# Simple selenium test for zarafa webapp
# Simply invoke 'nosetests' in this directry

import os
import time
import unittest

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoSuchElementException

URL = os.getenv('WEBAPP_URL', 'http://127.0.0.1/webapp/')
auth_user = os.environ['AUTH_USER']
auth_pass = os.environ['AUTH_PASS']


class TestWebApp(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.PhantomJS()
        self.driver.set_window_size(1120, 550)

    def tearDown(self):
        self.driver.quit()

    def fail_with_screenshot(self, msg):
        screenshot_name = 'screenshot.%s.png' % time.time()
        self.driver.save_screenshot(screenshot_name)
        self.fail("%s. Screenshot is at %s" % (msg, screenshot_name))

    def find_element_by_(self, type, name):
        try:
            find_element_by_ = getattr(self.driver, 'find_element_by_%s', type)
            return find_element_by_(name)
        except NoSuchElementException:
            self.fail_with_screenshot("No element %s of type %s found" %
                                      (name, type))
        except TimeoutException:
            self.fail_with_screenshot("Timeout waiting for %s of type %s found" %
                                      (name, type))

    def test_login(self):
        self.driver.get(URL)
        if 'WebApp' not in self.driver.title:
            self.fail_with_screenshot("Webapp not found in page title")
        elem = self.find_element_by_('name', 'username')
        elem.send_keys(auth_user)
        elem = self.find_element_by_('name', 'password')
        elem.send_keys(auth_pass)
        elem.send_keys(Keys.RETURN)

        xpath = '//button[text()="Continue"]'

        # wait 40 seconds until WebApp is loaded
        try:
            element = WebDriverWait(self.driver, 40).until(lambda self: self.find_element_by_("class_name", "icon_createEmailMessage"))
        except TimeoutException:
            # Maybe first login?
            try:
                elem = self.find_element_by_("xpath", xpath)
                elem.click()
                element = WebDriverWait(self.driver, 40).until(lambda self: self.find_element_by_("class_name", "icon_createEmailMessage"))
            except NoSuchElementException:
                self.fail("Failed to login")
        self.assertIsNotNone(element)
