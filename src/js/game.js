var Game = function(items) {
  this.totalClicks = 0;
  this.items = items;

  this.click = function(id) {
    return function (evt) {
      if (this.items.clicksOwned.total < 1) {
        this.log("You can't click for resources any more");
        return;
      }
      this.totalClicks++;
      this.items[id].total++;
      this.items.clicksOwned.total -= 1;
      num('clicksOwned', this.items.clicksOwned.total);
      num('t' + id, this.items[id].total);
    }.bind(this);
  };

  this.forin = function (obj, callback) {
    forin(obj, callback.bind(this));
  };

  this.log = function (msg) {
    console.log(msg);
  };

  this.updateAllItems = function(g) {
    var ii;
    for (ii = 0; ii < g.items.increaseClicksPerGeneration.total; ii++) {
      if (g.items.clicksOwned.total < g.items.maxClicks.total) {
        g.items.clicksOwned.total += 1;
      }
    }

    for (ii in g.items) {
      if (g.items.hasOwnProperty(ii) &&
          (g.items[ii].owned > 0 ||
           g.items[ii].buying)) {
        var item = g.items[ii];
        if (item.type === 'item') {
          g.updateItem(g, item);
        } else if(item.type === 'good') {
          g.updateGood(g, item);
        } else if(item.type === 'barrack') {
          g.updateBarrack(g, item);
        }
      }
    }
    g.updateCounters();
  };

  this.updateItem = function(g, item) {
    var ii = 0;
    for (kk = 0; kk < item.owned; kk++) {
      var total = g.items[item.resource].total;
      var maxStorage = g.items[item.resource].maxStorage;
      if (total + 1 > maxStorage) {
        g.items[item.resource].total -=
          0.25 * (total - maxStorage);
      } else {
        g.items[item.resource].total += 1;
      }
    }
  };

  this.updateGood = function(g, item) {
    var jj = 1;
    while (g.items[item.resource].total >= item.resourceCost &&
           jj <= item.owned) {
      jj += 1;
      g.items[item.resource].total -= item.resourceCost;
      g.items[item.good].total += 1;
    }
  };

  this.updateBarrack = function (g, item) {
    if (item.owned === 0 && !item.buying) {
      return;
    }

    if (item.buying) {
      this.forin(
        item.price,
        function (price, good, prices) {
          if (g.items[item.barrack].price[good] < 1) {
            return;
          }
          var mp = Math.min(price, g.items[good].total);
          g.items[good].total -= mp;
          g.items[item.barrack].priceProgress[good] += mp;
          g.items[item.barrack].price[good] -= mp;
        }
      );

      // see if item is fully purchased
      var purchased = true;
      this.forin(
        item.price,
        function (price, good, prices) {
          if (g.items[item.barrack].price[good] !== 0) {
            purchased = false;
            return;
          }
        }
      );

      if (purchased) {
        g.items[item.barrack].owned = 1;
        g.items[item.barrack].buying = false;
      } else {
        return;
      } // didn't fully purchase
    }// item buying

    if (item.owned) {
      this.forin(
        item.maintenance,
        function (price, resource, prices) {
          g.items[resource].total -= price;
          g.items[item.unit].owned += 1;
        }
      );
    }
  };

  this.updateCounters = function() {
    this.forin (
      this.items,
      function (item, name, items) {
        if (item.type === 'resource') {
          num('t' + item.resource, item.total);
          num('ps' + item.resource, item.maxStoragePrice);
          num('ms' + item.resource, item.maxStorage);
        } else if (item.type === 'item') {
          num('o' + name, item.owned);
          forin(item.price, function (price, resource) {
            num('p' + name + resource, price);
          });
        }else if (item.type === 'good') {
          forin(item.price, function (price, resource) {
            num('p' + name + resource, price);
          });
          num('o' + name, item.owned);
          num('t' + name, item.total);
        } else if (item.type === 'defender') {
          num(item.resource, item.owned);
        } else if (item.type === 'barrack') {
          forin(item.price, function (price, resource) {
            num('p' + name + resource, price);
          });
        } else if (item.type === 'maxClicks') {
          num(name, item.total);
        } else if (item.type === 'clicksOwned') {
          num(name, item.total);
        } else if (item.type === 'increaseMaxClicks') {
          num("p" + name, item.price);
        } else if (item.type === 'increaseClicksPerGeneration') {
          num("p" + name, item.price);
        }
      }
    );
  }.bind(this);

  this.buyGoodCreator = function (id) {
    return function (evt) {
      var itemInfo = this.items[id];
      var noMonies = false;
      this.forin(
        itemInfo.price,
        function (price, ii) {
          if (this.items[ii].total < price) {
            noMonies = true;
          }
        }
      );
      if (noMonies) {
        this.log("No Monies!");
        return;
      }
      this.forin(
        itemInfo.price,
        function (price, ii, item) {
          this.items[ii].total = this.items[ii].total - price;
          this.items[id].price[ii] *= this.items[id].priceJump;
        }
      );

      this.items[id].owned++;
      this.updateCounters();
      this.totalClicks++;
    }.bind(this);
  };

  this.sell = function (id) {
    return function (evt) {
      var item = this.items[id];
      if (item.owned > 0) {
        this.items[id].owned -= 1;
        this.forin(
          this.items[id].price,
          function (price, ii, item) {
            this.items[id].price[ii] /= this.items[id].priceJump;
          }
        );
      } else {
        this.log("you don't own any");
      }
      this.updateCounters();
    }.bind(this);
  };

  this.buyStorage = function(id) {
    return function (evt) {
      var item = this.items[id];
      if (this.items[id].total < item.maxStoragePrice) {
        this.log("You can't afford that");
        return;
      }
      this.items[id].total -= item.maxStoragePrice;
      this.items[id].maxStorage *= item.maxStorageJump;
      this.items[id].maxStoragePrice *= item.maxStoragePriceJump;

      this.updateCounters();
    }.bind(this);
  };

  this.buyBarrack = function(id) {
    return function(evt) {
      this.items[id].owned = false;
      this.items[id].buying = true;
      gId(id).disabled = true;
    }.bind(this);
  };

  this.buyIncreaseMaxClicks = function () {
    return function () {
      if (this.items.clicksOwned.total < 1 ||
          this.items.increaseMaxClicks.price <= 0) {
        return;
      }
      this.items.clicksOwned.total -= 1;
      num('clicksOwned', this.items.clicksOwned.total);

      this.items.increaseMaxClicks.price -= 1;

      if (this.items.increaseMaxClicks.price === 0) {
        this.items.increaseMaxClicks.initPrice *=
          this.items.increaseMaxClicks.priceJump;

        this.items.increaseMaxClicks.price =
          this.items.increaseMaxClicks.initPrice;
        this.items.maxClicks.total += 1;
      }

      this.updateCounters();
    }.bind(this);
  };

  this.buyIncreaseClicksPerGeneration = function () {
    return function () {
      if (this.items.clicksOwned.total < 1 ||
          this.items.increaseClicksPerGeneration.price <= 0) {
        return;
      }
      this.items.clicksOwned.total -= 1;
      num('clicksOwned', this.items.clicksOwned.total);

      this.items.increaseClicksPerGeneration.price -= 1;

      if (this.items.increaseClicksPerGeneration.price === 0) {
        this.items.increaseClicksPerGeneration.price =
          this.items.increaseClicksPerGeneration.initPrice;
        this.items.increaseClicksPerGeneration.initPrice *=
          this.items.increaseClicksPerGeneration.priceJump;

        this.items.increaseClicksPerGeneration.total += 1;
      }

      this.updateCounters();
    }.bind(this);
  };

  this.bindBuyGoodCreator = function(id) {
    bind(gId(id),'click', this.buyGoodCreator(id));
    this.bindSell(id);
  };

  this.bindBuyResourceCreator = function(id) {
    bind(gId(id),'click', this.buyGoodCreator(id));
    this.bindSell(id);
  };

  this.bindClick= function(id) {
    bind(gId(id), 'click', this.click(id));
  };

  this.bindSell = function(id) {
    var btn = gId("s" + id);
    if (btn) {
      bind(btn, 'click', this.sell(id));
    }
  };

  this.bindBuyStorage = function (id) {
    var btn = gId("s" + id);
    if (btn) {
      bind(btn, 'click', this.buyStorage(id));
    }
  };

  this.bindBuyBarrack = function(id) {
    var btn = gId(id);
    if (btn) {
      bind(btn, 'click', this.buyBarrack(id));
    }
  };

  this.bindIncreaseMaxClicks = function () {
    var btn = gId("increaseMaxClicks");
    bind(btn, 'click', this.buyIncreaseMaxClicks());
  };

  this.bindIncreaseClicksPerGeneration = function () {
    var btn = gId("increaseClicksPerGeneration");
    bind(btn, 'click', this.buyIncreaseClicksPerGeneration());
  };

  var constructor = (function (g) {
    forin(
      g.items,
      function (item, resource) {
        if (item.type === 'resource') {
          g.bindClick(resource);
          g.bindBuyStorage(resource);
        } else if (item.type === 'item') {
          g.bindBuyResourceCreator(resource);
        } else if (item.type === 'good') {
          g.bindBuyGoodCreator(item.good);
        } else if (item.type === 'barrack') {
          g.bindBuyBarrack(item.barrack);
        } else if (item.type === 'increaseMaxClicks') {
          g.bindIncreaseMaxClicks();
        } else if (item.type === 'increaseClicksPerGeneration') {
          g.bindIncreaseClicksPerGeneration();
        }
      }
    );

    g.updateCounters();

    setInterval(
      function () {
        g.updateAllItems(g);
      }, 1000);
  }(this));

};

(function() {
  var n = new Game(Gitems);
}());