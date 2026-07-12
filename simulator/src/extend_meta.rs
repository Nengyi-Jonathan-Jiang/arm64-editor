pub macro extend_meta {
    {
        $(#[$attr:meta])+
        $x:item $($rest:item)+
    } => {
        extend_meta!{ $(#[$attr])+ $x }
        extend_meta!{ $(#[$attr])+ $($rest)+ }
    },
    {
        $(#[$attr:meta])+
        $x:item
    } => {
        $(#[$attr])+
        $x
    },
    {$(#[$attr:meta])+} => {
        // Not empty, need a dummy item to support highlighting
        $(#[$attr])+ const _ : () = ();
    }
}
