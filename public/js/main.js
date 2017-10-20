(function($) {
	$(document).ready(function() {
		$(".dropdown-menu").on('click', function(e) {
			e.stopPropagation();
		})
	})
})(jQuery)