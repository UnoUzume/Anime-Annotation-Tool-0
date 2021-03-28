from PyQt5 import QtWidgets,QtCore,QtGui
from PyQt5.QtWidgets import *
from PyQt5.QtGui import *
import sys,os,requests
from PyQt5.QtWebEngineWidgets import *
 
 
class UI(QMainWindow,):
    def __init__(self):
        super(UI, self).__init__()
        self.setWindowTitle('Web browser')
        self.resize(680,480)
        self.setWindowIcon(QtGui.QIcon('./liulanqi.png'))
        self.main_toolbar = QtWidgets.QToolBar()
        self.main_toolbar.setIconSize(QtCore.QSize(16,16))
        self.addToolBar(self.main_toolbar)
        self.tabs = QtWidgets.QTabWidget()
        self.tabs.setDocumentMode(True)
        self.tabs.setTabsClosable(True)
        self.tabs_layout = QtWidgets.QGridLayout()
        self.tabs.setLayout(self.tabs_layout)
        self.url_edit = QtWidgets.QLineEdit()
 
 
        self.browser = QWebEngineView()
        Url = 'http://www.baidu.com'
        self.browser.setUrl(QtCore.QUrl(Url))
        self.tabs_layout.addWidget(self.browser)
        self.tabs.addTab(self.browser,'')
        self.browser.loadFinished.connect(lambda :self.tabs.setTabText(0,self.browser.page().title()))
        self.setCentralWidget(self.tabs)
 
 
 
        self.turn_button = QAction(QIcon('./zhuandao.png'),'Turn',self)
        self.back_button = QAction(QIcon('./fanhui.png'),'Back',self)
        self.next_button = QAction(QIcon('./tiaozhuan.png'),'Forward',self)
        self.stop_button = QAction(QIcon('./close.png'),'Stop',self)
        self.reload_button = QAction(QIcon('./shuaxin.png'),'Reload',self)
        self.add_button = QAction(QIcon('./add.png'),'Addpage',self)
 
 
 
        self.main_toolbar.addAction(self.back_button)
        self.main_toolbar.addAction(self.next_button)
        self.main_toolbar.addAction(self.stop_button)
        self.main_toolbar.addAction(self.reload_button)
        self.main_toolbar.addAction(self.add_button)
        self.main_toolbar.addWidget(self.url_edit)
        self.main_toolbar.addAction(self.turn_button)
 
 
 
        self.back_button.triggered.connect(self.browser.back)
        self.next_button.triggered.connect(self.browser.forward)
        self.stop_button.triggered.connect(self.browser.close)
        self.reload_button.triggered.connect(self.browser.reload)
        self.turn_button.triggered.connect(self.OpenUrlLine)
        self.browser.urlChanged.connect(self.setUrlLine)
        self.tabs.tabBarDoubleClicked.connect(self.NewPage)
        self.add_button.triggered.connect(self.NewPage)
        self.tabs.tabCloseRequested.connect(self.Closepage)
 
 
    def setUrlLine(self,url):
        self.url_edit.setText(url.toString())
 
    def OpenUrlLine(self):
        self.urlline = self.url_edit.text()
        print(self.urlline)
        self.browser.setUrl(QtCore.QUrl(self.urlline))
 
    def NewPage(self,url='http://www.baidu.com',label=''):
        browser = QWebEngineView()
        Url = 'http://www.baidu.com'
        browser.setUrl(QtCore.QUrl(Url))
        i = self.tabs.addTab(browser,label)
        self.tabs.setCurrentIndex(i)
        print(i)
 
        browser.loadFinished.connect(lambda :self.tabs.setTabText(i,browser.page().title()))
 
    def Closepage(self,i):
        if self.tabs.count() < 2:
            return
        self.tabs.removeTab(i)
 
 
 
 
if __name__ == '__main__':
    app = QApplication(sys.argv)
    gui = UI()
    gui.show()
    sys.exit(app.exec_())