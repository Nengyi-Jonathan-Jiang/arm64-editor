use crate::identity::privacy::IdentityPrivacy;

mod privacy {
    /// Trait to prevent [`super::Identity`] from being implemented by other modules
    pub trait IdentityPrivacy {}

    impl<T: ?Sized> IdentityPrivacy for T {}
}

/// Helper trait for expressing type identity in where bounds. All types `T` implement
/// [`Identity<Type=T>`](Identity::Type)
pub trait Identity: IdentityPrivacy {
    /// The own type.
    type Type: ?Sized;

    fn id(self) -> Self::Type
    where
        Self::Type: Sized;
    fn id_ref(&self) -> &Self::Type;
    fn id_mut(&mut self) -> &mut Self::Type;
}

impl<T: ?Sized> Identity for T {
    type Type = T;

    /// Get own type. This may be necessary when [`Identity`] is used in a where bound
    fn id(self) -> T
    where
        T: Sized,
    {
        self
    }

    /// Get own type from a reference. This may be necessary when [`Identity`] is used in a where
    /// bound
    fn id_ref(&self) -> &T {
        self
    }

    /// Get own type from a reference. This may be necessary when [`Identity`] is used in a where
    /// bound
    fn id_mut(&mut self) -> &mut T {
        self
    }
}
