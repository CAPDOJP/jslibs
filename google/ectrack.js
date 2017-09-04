/*
*--------------------------------------------------------------------
* ectrack.js
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
var ECTrack=function(options){
	if(!(this instanceof ECTrack)) return new ECTrack(options);
	/* initialize values */
	this.options={
		trackingid:('trackingid' in options)?options.trackingid:'',
		affiliation:('affiliation' in options)?options.affiliation:'',
		taxrate:('taxrate' in options)?options.taxrate:0
	};
	/* load script */
	if (!('GoogleAnalyticsObject' in window))
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
}
ECTrack.prototype={
	sendecommerce:function(options){
		var transactionid=new Date();
		var bill={
			subtotal:0,
			tax:0,
			total:0
		};
		var options={
			items:('items' in options)?options.items:[],
			shipping:('shipping' in options)?options.shipping:0
		};
		if(!(options.items instanceof Array)) return;
		/* calculate billing amount */
		for (var i=0;i<options.items.length;i++)
		{
			if(!(options.items[i] instanceof Array)) continue;
			if (!('name' in options.items[i])) options.items[i]['name']='';
			if (!('sku' in options.items[i])) options.items[i]['sku']='';
			if (!('category' in options.items[i])) options.items[i]['category']='';
			if (!('price' in options.items[i])) options.items[i]['price']=0;
			if (!('quantity' in options.items[i])) options.items[i]['quantity']=0;
			bill.subtotal+=options.items[i].price*options.items[i].quantity;
		}
		bill.subtotal+=options.shipping;
		bill.tax=bill.subtotal*this.options.taxrate;
		bill.total=bill.subtotal+bill.tax;
		/* create tracker */
		ga('create',this.options.trackingid,'auto','ecommercetracker');
		/* load plugin */
		ga('ecommercetracker.require','ecommerce');
		/* add transaction */
		ga('ecommercetracker.ecommerce:addTransaction',{
			'id':transactionid.getTime().toString(),
			'affiliation':this.options.affiliation,
			'revenue':bill.total.toString(),
			'shipping':options.shipping.toString(),
			'tax':bill.tax.toString()
		});
		/* add item */
		for (var i=0;i<options.items.length;i++)
		{
			ga('ecommercetracker.ecommerce:addItem',{
				'id':transactionid.getTime().toString(),
				'name':options.items[i].name,
				'sku':options.items[i].sku,
				'category':options.items[i].category,
				'price':options.items[i].price.toString(),
				'quantity':options.items[i].quantity.toString()
			});
		}
		/* send */
		ga('ecommercetracker.ecommerce:send');
	},
	sendpageview:function(){
		/* create tracker */
		ga('create',this.options.trackingid,'auto','pageviewtracker');
		/* send */
		ga('pageviewtracker.send','pageview');
	}
}