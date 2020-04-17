var VideoItemsRequests = {

};

var properties = [
    { property: 'title', control: 'title' },
    { property: 'akaTitle', control: 'akatitle' },
    { property: 'sinopsis', control: 'sinopsis' },
    { property: 'director', control: 'director' },
    { property: 'originalTitle', control: 'originaltitle' },
    { property: 'musicby', control: 'musicby' },
    { property: 'produced', control: 'produced' },
    { property: 'producer', control: 'producer' },
    { property: 'writer', control: 'writer' },
    { property: 'year', control: 'year' },
    { property: 'cast', control: 'cast' },
    { property: 'host', control: 'host' },
    { property: 'adminNotes', control: 'admin-notes' },
    { property: 'guests', control: 'guests' },
    { property: 'titleID', control: 'title-id' },
    { property: 'awards', control: 'awards' },
];

var itemsProperties = [
    { property: 'title', control: 'title' },
    { property: 'sinopsis', control: 'sinopsis' },
    { property: 'cast', control: 'cast' },
    { property: 'year', control: 'year' },
    { property: 'director', control: 'director' },
    { property: 'adminNotes', control: 'admin-notes' },
    { property: 'host', control: 'host' },
    { property: 'guests', control: 'guests' },
    { property: 'seasonNumber', control: 'season-number' },
    { property: 'seasonIndex', control: 'season-index' },
    { property: 'seasonTitle', control: 'season-title' },
    { property: 'episodeNumber', control: 'episode-number' },
    { property: 'episodeIndex', control: 'episode-index' },

];


$(function() {

     var loadAllCategories = function() {
         var url = '/api/categories';
         $.ajax(url, {
             method: 'GET',
             success: function(response) {
                 Categories = response;
                 if (VideoTitle) {
                     initSelectWithCategories('sb-categories');
                 }
             }
         })
     };

     var loadAllLanguages = function() {
         var url = '/api/languages';
         $.ajax(url, {
            method: 'GET',
            success: function(response) {
                Languages = response;
                if (VideoTitle) {
                    initSelectWithLanguages('sb-languages');
                }
            }
         });
     };

     var loadAllCountries = function() {
         var url = '/api/countries';
         $.ajax(url, {
             method: 'GET',
             success: function(response) {
                 Countries = response;
                 if (VideoTitle) {
                     initSelectWithCountries('sb-countries');
                 }
             }
         });
     };

     loadAllCategories();
     loadAllLanguages();
     loadAllCountries();

     var initSelectWithData = function (selector, items, options) {
         var data = items || [];
         var $select = $(selector);
         $select.html('');
         data.forEach(function (item) {
             var $option = $('<option />');
             $option.attr('value', item.value);
             $option.text(item.text);
             $option.prop('selected', item.selected);
             $select.append($option);
         });
         $select.select2(options || {});
     }

     var initSelectWithTags = function (selectID, tags, options) {
         var data = (tags || []).map(function (item) {
             return {
                 value: item,
                 text: item,
                 selected: true,
             };
         });
         initSelectWithData('#' + selectID, data, options);
     }

     var initSelectWithCategories = function(selectID) {
         var $select = $('#' + selectID);
         $select.html('');
         for (var i = 0; i < Categories.length; i++) {
             var topCategory = Categories[i];
             var $group = $('<optgroup />');
             $group.attr('label', topCategory.title);
             $select.append($group);
             for (var j = 0; j < topCategory.childs.length; j++) {
                 var subCategory = topCategory.childs[j];
                 var $option = $('<option />');
                 var _id = subCategory['id'];
                 var categoryShouldSelected = $.grep(VideoTitle.categories, function(item, index) {
                     return _id == item;
                 }).length > 0;
                 if (categoryShouldSelected) {
                     $option.attr('selected', 'selected');
                 }
                 $option.attr('value', _id);
                 $option.text(subCategory.title);
                 $group.append($option);
             }
         }
         $select.select2();
     };

     var initSelectWithLanguages = function(selectID) {

        var $select = $('#' + selectID);

        var attrShouldBeSelected = $select.data('selected-on-init') === true;

        var data = Languages.map(function (item) {

            var optionShouldSelected = attrShouldBeSelected 
                && 
                $.grep(VideoTitle.languages, function(lang, index) {
                 return lang == item;
            }).length > 0;

            return {
                value: item,
                text: item,
                selected: optionShouldSelected,
            };
         });

         return initSelectWithData('#' + selectID, data);

         
         $select.html('');
         for (var i = 0; i < Languages.length; i++) {
             var lang = Languages[i];
             var $option = $('<option />');
             $option.attr('value', lang);
             $option.text(lang);
             $select.append($option);
             var optionShouldSelected = $.grep(VideoTitle.languages, function(item, index) {
                 return lang == item;
             }).length > 0;
             if (optionShouldSelected) {
                 $option.attr('selected', 'selected');
             }
         }
         $select.select2();
     };

     var initSelectWithCountries = function(selectID) {
         var $select = $('#' + selectID);
         $select.html('');
         for (var i = 0; i < Countries.length; i++) {
             var value = Countries[i];
             var $option = $('<option />');
             $option.attr('value', value);
             $option.text(value);
             $select.append($option);
             var optionShouldSelected = $.grep(VideoTitle.countries, function(item, index) {
                 return value == item;
             }).length > 0;
             if (optionShouldSelected) {
                 $option.attr('selected', 'selected');
             }
         }
         $select.select2();
     };

     if (VideoTitleID) {
         var url = '/api/video/titles/' + VideoTitleID;
         $.ajax(url, {
             method: 'GET',
             success: function(response) {

                 VideoTitle = response;

                 if (Categories) {
                     initSelectWithCategories('sb-categories');
                 }

                 if (Languages) {
                     initSelectWithLanguages('sb-languages');
                 }

                 if (Countries) {
                     initSelectWithCountries('sb-countries');
                 }

                 var tags = VideoTitle.tags || [];
                 if (tags) {
                     var tagsOptions = {
                        tags: true,
                        placeholder: 'Введите тэги',
                        allowClear: true
                     };
                     initSelectWithTags('sb-tags', tags, tagsOptions);
                 }

                 for (var i = 0; i < properties.length; i++) {
                     var item = properties[i];
                     initControlFromValue(response, item.property, '#tb-video-', item.control)
                 }

                 $('#left-menu-video-title').html(videoTitleLeftMenuTemplate(response));

                 $('#tb-video-ispublic').prop('checked', response.isPublic ? true : false);
                 var createDate = response.createDate;
                 if (createDate) {
                     createDate = new Date(createDate);
                     $('#tb-create-date').val(createDate.toLocaleString());
                 }

                 if (InitialVideoItemID) {
                     loadVideoItems(function () {
                          for (let i = 0; i < VideoItems.length; i++) {
                              let item = VideoItems[i];
                              if (item._id == InitialVideoItemID) {
                                  showVideoItemEditUI(item);
                                  let selector = '.memocast-switch-video-item[memocastitemid="' + item['_id'] + '"]';
                                  $(selector).trigger('click');
                                  break;
                              }
                          }
                     });
                 }
             }
         })
         loadVideoTitleImages();
     }

    var initControlFromValue = function(obj, property, prefix, controlID) {
        if (obj) {
            var val = obj[property];
            if (val) {
                $(prefix + controlID).val(val);
            } else {
                $(prefix + controlID).val('');
            }
        }
    }

    videoTitleUpdateRequest = null;

    var setSubmitButtonStatus = function(status) {

        var $bt = $('#bt-video-title-submit');

        switch (status) {
            case 'submitting':

                disableFormButton('#bt-video-title-submit', 'Сохранение ...');

                break;

            case 'normal':

                window.setTimeout(function () {
                    enableFormButton('#bt-video-title-submit','Сохранить');
                }, 1000);

                break;
        };
    }

    $('#form-video').submit(function(evt) {

        evt.preventDefault();

        var $status = $('#video-title-process-status');

        if (videoTitleUpdateRequest) {

            videoTitleUpdateRequest.abort();
            videoTitleUpdateRequest = null;

            setSubmitButtonStatus('normal');

        } else {


            var $form = $(this);

            setSubmitButtonStatus('submitting');

            if (VideoTitle) {
                for (var i = 0; i < properties.length; i++) {
                    var item = properties[i];
                    var val = $('#tb-video-' + item.control).val();
                    VideoTitle[item.property] = val;
                }
                VideoTitle.isPublic = $('#tb-video-ispublic').prop('checked');
                VideoTitle.languages = $('#sb-languages').val();
                VideoTitle.countries = $('#sb-countries').val();
                VideoTitle.categories = $('#sb-categories').val();
                let tags = $('#sb-tags').val() ? $('#sb-tags').val() : [];
                VideoTitle.tags = tags.filter(function (item) {
                        return item !== '';
                    });
                VideoTitle.searchTitle = VideoTitle.title;
                if (VideoTitle.akaTitle) {
                  VideoTitle.searchTitle +=  VideoTitle.akaTitle;
                } else if (VideoTitle.originalTitle) {
                  VideoTitle.searchTitle += VideoTitle.originalTitle;
                } else if (VideoTitle.year) {
                  VideoTitle.searchTitle += VideoTitle.year;
                }
                VideoTitle.searchTitle = VideoTitle.searchTitle.replace(/[\s\"\'\(\)\-\.]/g, "");
            }

            var url = '/api/video/titles/' + VideoTitleID;
            var data = VideoTitle;
            videoTitleUpdateRequest = $.ajax(url, {
                method: 'PUT',
                data: data,
                success: function(response) {
                    alertify.success('Updated');
                },
                error: function(err) {
                    alertify.error(err.responseJSON.error);
                },
                complete: function(err) {

                    setSubmitButtonStatus('normal');

                    videoTitleUpdateRequest = null;
                }
            });

        }
    });

    videoTitleLeftMenuTemplate = Handlebars.compile($("#template-video-title-left-menu").html());

    videoItemsListTemplate = Handlebars.compile($('#template-video-title-items-list').html());

    videoItemFilesTemplate = Handlebars.compile($('#template-video-item-files-list').html());

    videoItemCaptionsTemplate = Handlebars.compile($('#template-video-item-captions-list').html());

    var lmSwitchMenuClick = function(evt) {
        evt.preventDefault();

        var elementToSwitch = $(this).attr('memocast-bind-element');
        var itemID = $(this).attr('memocastitemid');

        var $items = $('.memocast-switch-item');

        for (var i = 0; i < $items.length; i++) {
            var $item = $items.eq(i);
            var currentElement = $item.attr('memocast-bind-element');
            if (currentElement != elementToSwitch) {
                $('#' + currentElement).hide();
            }
        }

        if (itemID) {
            if (VideoItems) {

                for (var i = 0; i < VideoItems.length; i++) {
                    var item = VideoItems[i];
                    if (itemID === item._id) {
                        showVideoItemEditUI(item, true);
                        break;
                    }
                }
            }
        }
        $('#' + elementToSwitch).show();

    };

    $(document).on('click', '.memocast-switch-item', lmSwitchMenuClick);

    $(document).on('click', '#lm-video-items', function(evt) {
        evt.preventDefault();

        if (!VideoItems) {
            loadVideoItems();
        } else {
            displayVideoItems();
        }
    });

    var displayVideoItems = function (items) {
        if (typeof(items) != 'undefined') {
            VideoItems = items;
        }

        VideoItems.forEach(function (item, i) {
            item['mmc-row-index'] = i + 1;
        });

        $('#pan-video-title-items').html(videoItemsListTemplate(VideoItems));

        var pageLength = getStorageValue('title-items-page-length', 50);

        var table = $('#pan-video-title-items .memocast-video-list').DataTable({
            search: {
                smart: true
            },
            pageLength: pageLength,
            responsive: true
        });

        table.on( 'length.dt', function ( e, settings, len ) {
            setStorageValue('title-items-page-length', len);
        });

        $('#pan-video-title-items .memocast-video-list td[mmc-time-stamp]').each(function (index) {
            var $el = $(this);
            var ts = $el.attr('mmc-time-stamp');
            var d = new Date(ts);
            $el.text(d.toLocaleDateString() + ' ' + d.toLocaleTimeString());
        });

        $('#pan-video-title-items .memocast-video-list tbody').on( 'click', '.mmc-item-link', function () {

            var videoItemID = $(this).attr('memocast-item-id');
            var videoItem = $.grep(VideoItems, function(item) {
                return item['_id'] == videoItemID;
            });

            if (videoItem.length > 0) {
                videoItem = videoItem[0];
                showVideoItemEditUI(videoItem);

                var selector = '.memocast-switch-video-item[memocastitemid="' + videoItem['_id'] + '"]';
                $(selector).trigger('click');

            }
        } );
    }

    var loadVideoItems = function(callback) {

        var url = '/api/video/titles/' + VideoTitle['_id'] + '/items';
        $.ajax(url, {
            method: 'GET',
            success: function(response) {

                displayVideoItems(response);

                if (callback) {
                    callback();
                }
            }
        });

    };

    // video item's files container
    let $files = $('#video-item-files');

    // load video item's files
    let loadVideoItemFiles = function (id) {
        let url = '/api/admin/files';
        let data = {
            item : id
        };
        $.ajax(url, {
            method: 'GET',
            data: data,
            success: function (response) {
                let html = videoItemFilesTemplate(response);
                $files.html(html);
            },
            error: function (err) {
            }
        });
    }

    // video item's files container
    let $captions = $('#video-item-captions');

    // load video item's captions
    let loadVideoItemCaptions = function (id) {
        let url = '/api/admin/captions/item/' + id;
        $.ajax(url, {
            method: 'GET',
            success: function (response) {
                let html = videoItemCaptionsTemplate(response);
                $captions.html(html);
                initSelectWithLanguages('new-captions-language');
            },
            error: function (err) {
            }
        });
    }

    Handlebars.registerHelper('fancynumber', function(item){
      return item.toLocaleString('en-US');
    });

    // remove/delete files handler
    $(document).on('click', '.mmc-delete-file-button', function () {
        let $bt = $(this);
        let fileID = $bt.data('file-id');
        let question = 'Are you sure?';
        if (window.confirm(question)) {
            let url = '/api/admin/files/' + fileID;
            $.ajax(url, {
                method: 'DELETE',
                complete: function () {
                    loadVideoItemFiles(CurrentVideoItem._id);
                }
            });
        }
    });

    // remove/delete captions handler
    $(document).on('click', '.mmc-delete-caption-button', function () {
        let $bt = $(this);
        let captionID = $bt.data('caption-id');
        let question = 'Are you sure?';
        if (window.confirm(question)) {
            let url = '/api/admin/captions/' + captionID;
            $.ajax(url, {
                method: 'DELETE',
                complete: function () {
                    loadVideoItemCaptions(CurrentVideoItem._id);
                }
            });
        }
    });

    var lastVideoItemID = null;

    var showVideoItemEditUI = function(videoItem, skipTriggerMenu) {

        if (lastVideoItemID === videoItem._id) {
            return;
        }
        lastVideoItemID = videoItem._id;

        // clear files html
        $files.html('');
        // load files for selected video item
        loadVideoItemFiles(videoItem._id);
        // load captions for selected video item
        loadVideoItemCaptions(videoItem._id);

        $('#movie-link').attr('href', '/video/' + videoItem.videoTitle + '/' + videoItem._id);

        CurrentVideoItem = videoItem;

        initItemSelectWithCategories('sb-item-categories');
        initItemSelectWithLanguages('sb-item-languages');

        for (var i = 0; i < itemsProperties.length; i++) {
            var item = itemsProperties[i];
            initControlFromValue(videoItem, item.property, '#tb-video-item-', item.control);
        }

        $('#tb-video-item-ispublic').prop('checked', videoItem.isPublic ? true : false);
        var createDate = videoItem.createDate;
        if (createDate) {
            createDate = new Date(createDate);
            $('#tb-video-item-create-date').val(createDate.toLocaleString());
        }
        var airDate = videoItem.airDate;

        var pickerOptions = {
            format: "dd.mm.yyyy",
            clearBtn: true,
            language: "ru"
        };

        if (airDate) {
            airDate = new Date(airDate);
            var airDateString = airDate.getDate() + '.' + (airDate.getMonth() + 1) + '.' + airDate.getFullYear();
            $('#tb-video-item-air-date').val(airDateString);

            pickerOptions.defaultViewDate = {
                year: airDate.getFullYear(),
                month: airDate.getMonth(),
                day: airDate.getDate()
            }
        }

        $('#tb-video-item-air-date').datepicker(pickerOptions);

        var $menu = $('.memocast-switch-menu');
        var selector = '.memocast-switch-item[memocastitemid="' + videoItem['_id'] + '"]';
        var $menuItem = $(selector);

        if ($menuItem.length == 0) {
            $menuItem = $('<a/>');
            $menuItem.attr('memocastitemid', videoItem['_id']);
            $menuItem.addClass('dropdown-item');
            $menuItem.addClass('memocast-switch-item');
            var $link = $menuItem;
            // $link.addClass('memocast-switch-item');
            $link.attr('href', '#');
            $link.text(' ' + videoItem.title);
            var $icon = $('<i class="fa fa-pencil fa-fw"></i>');
            $link.prepend($icon);
            $link.attr('memocast-bind-element', 'pan-video-item-edit');
            // $link.on('click', lmSwitchMenuClick);
            // $menuItem.append($link);
            $menu.append($menuItem);
        }

        if (typeof(skipTriggerMenu) == "undefined" || skipTriggerMenu === false) {
            $menuItem.trigger('click');
        }

    };

    var initItemSelectWithCategories = function(selectID) {
         var $select = $('#' + selectID);
         $select.html('');
         for (var i = 0; i < Categories.length; i++) {
             var topCategory = Categories[i];
             var $group = $('<optgroup />');
             $group.attr('label', topCategory.title);
             $select.append($group);
             for (var j = 0; j < topCategory.childs.length; j++) {
                 var subCategory = topCategory.childs[j];
                 var $option = $('<option />');
                 var _id = subCategory['_id'];
                 var categoryShouldSelected = $.grep(VideoTitle.categories, function(item, index) {
                     return _id == item;
                 }).length > 0;
                 if (categoryShouldSelected) {
                     $option.attr('selected', 'selected');
                 }
                 $option.attr('value', _id);
                 $option.text(subCategory.title);
                 $group.append($option);
             }
         }
         $select.select2({
           width: '100%'
         });
     };

     var initItemSelectWithLanguages = function(selectID) {
         var $select = $('#' + selectID);
         $select.html('');
         for (var i = 0; i < Languages.length; i++) {
             var lang = Languages[i];
             var $option = $('<option />');
             $option.attr('value', lang);
             $option.text(lang);
             $select.append($option);
             var optionShouldSelected = $.grep(VideoTitle.languages, function(item, index) {
                 return lang == item;
             }).length > 0;
             if (optionShouldSelected) {
                 $option.attr('selected', 'selected');
             }
         }
         $select.select2({
           width: '100%'
         });
     };

    $('#form-video-item').submit(function(evt) {

        evt.preventDefault();

        if (CurrentVideoItem) {

            for (var i = 0; i < itemsProperties.length; i++) {
                var item = itemsProperties[i];
                var val = $('#tb-video-item-' + item.control).val();
                CurrentVideoItem[item.property] = val;
            }
            CurrentVideoItem.isPublic = $('#tb-video-item-ispublic').prop('checked');
            CurrentVideoItem.languages = $('#sb-item-languages').val();
            CurrentVideoItem.categories = $('#sb-item-categories').val();

            var val = $('#tb-video-item-air-date').val();
            CurrentVideoItem.airDate = null;
            if (val && val != '') {
                var reg = /(\d+)/g
                var matches = val.match(reg)
                if (matches) {
                    if (matches.length == 3) {
                        var day = parseInt(matches[0]);
                        var month = parseInt(matches[1]) - 1;
                        var year = parseInt(matches[2]);
                        airDate = new Date(year, month, day);
                        CurrentVideoItem.airDate = airDate.toISOString();
                    }
                }
            }

            updateVideoItem(CurrentVideoItem);
        }

    });

    $(document).on('click', '.memocast-switch-item', function() {

        var $li = $(this).closest('li');
        var id = $li.attr('memocastitemid');
        if (id && id != '') {
            var search = $.grep(VideoItems, function(el) {
                 return el['_id'] == id;
            });
            if (search.length > 0) {
                var item = search[0];
                showVideoItemEditUI(item);
            }
        }

    });

    $('#tb-video-title, #tb-video-year').change(function() {
        var title = $('#tb-video-title').val();
        var year = $('#tb-video-year').val();
        var newTitleID = helpers.permalink(title + '-' + year);
        $('#tb-video-title-id').val(newTitleID);
    });

    $(document).on('submit', '#new-captions-form', function(evt) {
        evt.preventDefault();

        var form = new FormData();
        form.append('videoItem', CurrentVideoItem._id);
        form.append('language', document.getElementById('new-captions-language').value);
        form.append('file', document.getElementById('new-captions-file').files[0]);
        var url = '/api/admin/captions';
        $.ajax(url, {
            method: 'POST',
            data: form,
            processData: false,
            contentType: false,
            success: function(response) {
            },
            error: function(err) {
            },
            complete: function() {
                loadVideoItemCaptions(CurrentVideoItem._id);
            }
        })
    });

});

var videoItemUpdateIndicatorStart = function(id) {

    var selector = 'li[memocastitemid="' + id + '"] i.fa';
    var $icon = $(selector);
    if ($icon.hasClass('fa-pencil')) {
        $icon.removeClass('fa-pencil');
    }

    if (!$icon.hasClass('fa-spin')) {
        $icon.addClass('fa-spin');
    }
    if (!$icon.hasClass('fa-circle-o-notch')) {
        $icon.addClass('fa-circle-o-notch');
    }

};

var videoItemUpdateIndicatorStop = function(id) {

    var selector = 'li[memocastitemid="' + id + '"] i.fa';
    var $icon = $(selector);
    if (!$icon.hasClass('fa-check')) {
        $icon.addClass('fa-check');
    }

    if ($icon.hasClass('fa-spin')) {
        $icon.removeClass('fa-spin');
    }
    if ($icon.hasClass('fa-circle-o-notch')) {
        $icon.removeClass('fa-circle-o-notch');
    }

};

var updateVideoItem = function(videoTitle) {

    var url = '/api/video/items/' + videoTitle['_id'];
    videoItemUpdateIndicatorStart(videoTitle['_id']);
    disableFormButton('#bt-video-item-submit', 'Сохранение ...');
    $.ajax(url, {
        method: 'PUT',
        data: videoTitle,
        success: function(response) {
        },
        error: function(err) {
        },
        complete: function() {
            videoItemUpdateIndicatorStop(videoTitle['_id']);
            window.setTimeout(function () {
                enableFormButton('#bt-video-item-submit', 'Сохранить');
            }, 1000);

            // $bt.prop('disabled', false);
        }
    });

};

var loadVideoTitleImages = function () {
    let url = '/api/admin/images';
    let data = {
        videoTitle : VideoTitleID
    };
    $.ajax(url, {
        method: 'GET',
        data: data,
        success: function (images) {
            // set up images workflow
            var $imageFile = $('#video-title-file').fileinput({
                theme: 'fa',
                uploadUrl : '/api/admin/images/',
                uploadExtraData: {
                     videoTitle : VideoTitleID
                },
                initialPreview: images.map(function (img) {
                    return '<img src="/images/img/' + img['_id'] + '?width=120" class="file-preview-image" />';
                }),
                initialPreviewConfig: images.map(function (img) {
                    return {
                        url: '/api/admin/images/' + img['_id'],
                        key: img['_id']
                    };
                }),
                uploadAsync: true,
                allowedFileTypes: ['image'],
                previewFileIcon: '<i class="fa fa-file"></i>',
                fileActionSettings: {

                }
            });
            $imageFile.on('change', function (event) {
            });
        },
        error: function (err) {
        }
    })
}
