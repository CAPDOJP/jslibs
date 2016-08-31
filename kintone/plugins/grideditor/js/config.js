/*
*--------------------------------------------------------------------
* jQuery-Plugin "grideditor -config.js-"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($){
	"use strict";
	var VIEW_NAME='一括編集';
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var body={
			app:kintone.app.getId()
		};
	    /* get view lists */
		kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'GET',body,function(resp){
			var req=$.extend(true,{},resp);
			req.app=kintone.app.getId();
			if (!req.views[VIEW_NAME])
			{
			    /* swaps the index */
				for (var key in req.views) req.views[key].index=Number(req.views[key].index)+1;
    		    /* create custom view */
				req.views[VIEW_NAME]={
					type:'CUSTOM',
					name:VIEW_NAME,
					html:'<div id="grideditor-container" class="customview-container"></div>',
					filterCond:'',
					sort:'',
					pager:false,
					index:0
				};
			}
			/* save viewid */
			kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'PUT',req,function(resp){
				kintone.plugin.app.setConfig({viewId:resp.views[VIEW_NAME].id});
			},function(error){});
		},function(error){});
	});
})(jQuery);