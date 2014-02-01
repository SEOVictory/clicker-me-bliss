var Game = function() {
  this.r1 = 0;
  this.totalClicks = 0;
  this.items = {
    i1: {
      name: '5 more clicks',
      price: {
        r1: 20
      },
      resource: 'r1',
      modifier: 1,
      priceJump: 1.01,
      owned: 0
    }
  };

  this.click = function(id) {
    return function (evt) {
      this.totalClicks++;
      this[id]++;
      num('t' + id, this[id]);
    }.bind(this);
  };

  this.forin = function (obj, callback) {
    forin(obj, callback.bind(this));
  };

  this.spend = function (id) {

    return function (evt) {
      var itemInfo = this.items[id];
      var noMonies = false;

      this.forin(
        itemInfo.price,
        function (price, ii) {
          if (this[ii] < price) {
            noMonies = true;
          }
        }
      );

      if (noMonies) {
        console.log("No Monies!");
        return;
      }

      this.forin(
        itemInfo.price,
        function (price, ii, item) {
          this[ii] = this[ii] - price;
          this.items[id].price[ii] *= this.items[id].priceJump;
          num('t' + ii, this[ii]);
          num("c" + id, this.items[id].price[ii]);
        }
      );

      this.items[id].owned++;
      num('t' + id,  this.items[id].owned);
      this.totalClicks++;
    }.bind(this);
  };

  this.bindSpend = function(id) {
    bind(gId(id),'click', this.spend(id));
  };

  this.bindClick= function(id) {
    bind(gId(id),'click', this.click(id));
  };

  var constructor = (function (g) {
    g.bindClick('r1');
    g.bindSpend('i1');

    num('tr1', g.r1);
    num('ti1', g.items.i1.owned);

    setInterval(
      function () {
        var ii;
        for (ii in g.items) {
          if (g.items.hasOwnProperty(ii)) {
            var item = g.items[ii];
            g[item.resource] += item.owned * item.modifier;
            num("t" + item.resource, g[item.resource]);
          }
        }
      }, 1000);
  }(this));
};

g = new Game();